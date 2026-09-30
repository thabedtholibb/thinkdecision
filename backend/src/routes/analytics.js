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

    if (caseIds.length > 0) {
      const [
        { data: caseExperts },
        { data: judgments },
        { data: judgmentData },
        { data: caseExpertsByMonth },
      ] = await Promise.all([
        supabase.from('case_experts').select('expert_id, status').in('case_id', caseIds),
        supabase.from('judgments').select('expert_id').in('case_id', caseIds),
        supabase.from('judgments').select('consistency_ratio').in('case_id', caseIds),
        supabase.from('case_experts').select('expert_id, created_at, case_id').in('case_id', caseIds),
      ]);

      // Count unique experts
      const uniqueExperts = new Set(caseExperts?.map(ce => ce.expert_id) || []);
      totalExperts = uniqueExperts.size;
      totalInvited = caseExperts?.length || 0;

      const expertsWithSubmissions = new Set(judgments?.map(j => j.expert_id) || []);
      totalSubmitted = expertsWithSubmissions.size;

      const crValues = judgmentData
        ?.filter(j => j.consistency_ratio !== null && j.consistency_ratio !== undefined)
        .map(j => parseFloat(j.consistency_ratio)) || [];

      avgCR = crValues.length > 0
        ? parseFloat((crValues.reduce((a, b) => a + b, 0) / crValues.length).toFixed(4))
        : 0;

      // Calculate trends by month
      const trendsMap = new Map();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

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
