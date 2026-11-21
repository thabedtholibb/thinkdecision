const express = require('express');
const authenticate = require('../middleware/authenticate');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const period = req.query.period || '6m';

    // Explicit columns only; dependent queries run in parallel afterwards
    // (previously 5 sequential roundtrips, two of them select('*')).
    const { data: cases } = await supabase
      .from('cases')
      .select('id,status,created_at,updated_at')
      .eq('creator_id', req.user.id);

    const caseIds = cases?.map(c => c.id) || [];
    const totalCases = cases?.length || 0;
    const activeCases = cases?.filter(c => c.status === 'active').length || 0;
    const completedCases = cases?.filter(c => c.status === 'completed').length || 0;

    // Calculate total unique experts invited
    let totalExperts = 0;
    let totalInvited = 0;
    let totalSubmitted = 0;
    let avgCR = 0;
    let trends = [];
    let topExperts = [];
    // CR bins mirror the results screen: consistent (<=0.05), acceptable,
    // borderline, and above the 0.15 hard limit.
    const crDistribution = [
      { range: '≤0.05', n: 0 },
      { range: '0.05-0.10', n: 0 },
      { range: '0.10-0.15', n: 0 },
      { range: '>0.15', n: 0 },
    ];

    if (caseIds.length > 0) {
      const [
        { data: caseExperts },
        { data: judgments },
        { data: judgmentData },
        { data: caseExpertsByMonth },
      ] = await Promise.all([
        supabase.from('case_experts').select('expert_id, status').in('case_id', caseIds),
        supabase.from('judgments').select('expert_id, case_id').in('case_id', caseIds),
        // `judgments` has no consistency_ratio column; CR lives in its own table.
        supabase.from('consistency_ratios').select('expert_id, case_id, cr').in('case_id', caseIds),
        supabase.from('case_experts').select('expert_id, created_at, case_id').in('case_id', caseIds),
      ]);

      // Count unique experts
      const uniqueExperts = new Set(caseExperts?.map(ce => ce.expert_id) || []);
      totalExperts = uniqueExperts.size;
      totalInvited = caseExperts?.length || 0;

      const expertsWithSubmissions = new Set(judgments?.map(j => j.expert_id) || []);
      totalSubmitted = expertsWithSubmissions.size;

      const crValues = judgmentData
        ?.filter(row => row.cr !== null && row.cr !== undefined)
        .map(row => parseFloat(row.cr)) || [];

      avgCR = crValues.length > 0
        ? parseFloat((crValues.reduce((a, b) => a + b, 0) / crValues.length).toFixed(4))
        : 0;

      crValues.forEach(v => {
        if (v <= 0.05) crDistribution[0].n += 1;
        else if (v <= 0.10) crDistribution[1].n += 1;
        else if (v <= 0.15) crDistribution[2].n += 1;
        else crDistribution[3].n += 1;
      });

      // Per-expert activity: distinct cases judged + mean CR across levels.
      const perExpert = new Map();
      const ensureExpert = (id) => {
        if (!perExpert.has(id)) perExpert.set(id, { cases: new Set(), crs: [] });
        return perExpert.get(id);
      };
      judgments?.forEach(j => {
        if (!j.expert_id) return;
        const entry = ensureExpert(j.expert_id);
        if (j.case_id) entry.cases.add(j.case_id);
      });
      judgmentData?.forEach(row => {
        if (!row.expert_id || row.cr === null || row.cr === undefined) return;
        ensureExpert(row.expert_id).crs.push(parseFloat(row.cr));
      });

      const topEntries = Array.from(perExpert.entries())
        .sort((a, b) => b[1].cases.size - a[1].cases.size)
        .slice(0, 5);

      if (topEntries.length > 0) {
        const { data: expertUsers } = await supabase
          .from('users')
          .select('id,name')
          .in('id', topEntries.map(([id]) => id));
        const nameById = new Map((expertUsers || []).map(u => [u.id, u.name]));

        topExperts = topEntries.map(([id, entry]) => ({
          id,
          name: nameById.get(id) || '—',
          cases: entry.cases.size,
          cr: entry.crs.length
            ? parseFloat((entry.crs.reduce((a, b) => a + b, 0) / entry.crs.length).toFixed(3))
            : null,
        }));
      }

      // Calculate trends by month
      const trendsMap = new Map();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      cases?.forEach(c => {
        const createdDate = new Date(c.created_at);
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth()).padStart(2, '0')}`;
        const monthName = monthNames[createdDate.getMonth()];

        if (!trendsMap.has(monthKey)) {
          trendsMap.set(monthKey, { month: monthName, cases: 0, experts: 0 });
        }

        const trend = trendsMap.get(monthKey);
        trend.cases += 1;
      });

      caseExpertsByMonth?.forEach(ce => {
        const createdDate = new Date(ce.created_at);
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth()).padStart(2, '0')}`;

        if (trendsMap.has(monthKey)) {
          const trend = trendsMap.get(monthKey);
          // Count unique experts per month
          if (!trend.expertsSet) trend.expertsSet = new Set();
          trend.expertsSet.add(ce.expert_id || 'unknown');
        }
      });

      // Convert trends map to array and clean up
      trends = Array.from(trendsMap.values())
        .sort((a, b) => {
          const monthOrder = monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
          return monthOrder;
        })
        .slice(-6)  // Last 6 months
        .map(t => ({
          month: t.month,
          cases: t.cases,
          experts: t.expertsSet ? t.expertsSet.size : 0
        }));
    }

    // Calculate average fill time (days between case creation and submission)
    let avgFillTime = 0;
    if (completedCases > 0) {
      const { data: completedCaseData } = await supabase
        .from('cases')
        .select('created_at, updated_at')
        .eq('creator_id', req.user.id)
        .eq('status', 'completed');

      const fillTimes = completedCaseData?.map(c => {
        const created = new Date(c.created_at);
        const updated = new Date(c.updated_at);
        const diffMs = updated - created;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return Math.round(diffDays);
      }) || [];

      avgFillTime = fillTimes.length > 0
        ? Math.round(fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length)
        : 0;
    }

    // Calculate invitation conversion rate
    const invitationConversion = totalInvited > 0
      ? parseFloat((totalSubmitted / totalInvited).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalCases,
          activeCases,
          completedCases,
          totalExperts,
          avgFillTime,
          avgCR,
          invitationConversion,
        },
        trends,
        crDistribution,
        topExperts,
      },
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;
