/* Expert screens — dashboard, pairwise-fill */

const EXPERT_NAV = [
  { id: 'dashboard', label: 'Dashboard',   icon: 'home' },
  { id: 'help',      label: 'Bantuan',     icon: 'info' },
];

// =====================================================
// Expert Dashboard
// =====================================================
function ExpertDashboard({ go, theme, onToggleTheme, onSwitchRole, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState({ invitations: [], stats: { activeCases: 0, completedCases: 0, avgCR: 0, totalContributions: 0 } });
  const [loading, setLoading] = useState(true);

  // Use notifications hook for real-time notifications
  const { notifications: allNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(30000);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await window.expertsService.getExpertDashboard();
        console.log('Dashboard data:', data);
        if (data) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch expert dashboard:', error);
        alert('Error mengambil data dashboard: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const invitations = dashboardData.invitations || [];
  const stats = dashboardData.stats || {};
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const selectedCase = invitations.find(it => (it.case_id || it.caseId) === selectedCaseId);

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar items={EXPERT_NAV} active="dashboard" onChange={(item) => {
        switch(item) {
          case 'dashboard': go({ screen: 'expert-dashboard' }); break;
          case 'help': go({ screen: 'expert-tutorial' }); break;
        }
      }} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}
        footer={
          <div className="p-3 border-t border-ink-200 dark:border-ink-800 flex items-center gap-2">
            <Avatar name={user?.name || 'Dr Budi'} color="#10b981"/>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold truncate text-ink-800 dark:text-ink-100">{user?.name}</div>
              <div className="text-[11px] text-emerald-600">Pakar</div>
            </div>
            <button onClick={() => go({ screen: 'landing' })} className="w-8 h-8 grid place-items-center rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500" title="Keluar"><Icon name="logout" className="w-4 h-4"/></button>
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <TopBar
          title={`Selamat datang, ${(user?.name || '').split(' ')[0] || 'Dr. Budi'}`}
          subtitle="Anda diundang sebagai pakar untuk beberapa kasus pengambilan keputusan"
          theme={theme} onToggleTheme={onToggleTheme}
          onSwitchRole={onSwitchRole} role="expert"
          notifications={allNotifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
        <main className="p-6 space-y-6 anim-fade">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Kasus Aktif"    value={String(stats.activeCases || 0)}  delta="sedang diisi" icon="layers" tone="brand"/>
            <StatCard label="Selesai"        value={String(stats.completedCases || 0)}  delta="telah dikirim"          icon="check"  tone="green"/>
            <StatCard label="Avg. CR Anda"   value={(stats.avgCR || 0).toFixed(2)} delta={stats.avgCR <= 0.10 ? "di bawah threshold" : "di atas threshold"} icon="sparkle" tone={stats.avgCR <= 0.10 ? "sky" : "amber"}/>
            <StatCard label="Kontribusi" value={String(stats.totalContributions || 0)} delta="total kasus" icon="users" tone="amber"/>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
            <Card>
              <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-800">
                <div>
                  <h2 className="font-serif text-[20px] text-ink-900 dark:text-ink-50">Kasus yang Diundang</h2>
                  <p className="text-[12px] text-ink-500">{invitations.length} kasus {stats.activeCases > 0 ? `· ${stats.activeCases} sedang aktif` : ''}</p>
                </div>
              </div>
              {loading ? (
                <div className="p-8 text-center text-ink-500">Memuat kasus...</div>
              ) : invitations.length === 0 ? (
                <div className="p-8 text-center text-ink-500">Belum ada kasus yang diundang</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                  {invitations.map(it => {
                    const caseId = it.case_id || it.caseId;
                    const ddl = new Date(it.cases?.deadline || it.deadline);
                    const days = Math.ceil((ddl - new Date()) / (1000*60*60*24));
                    const caseName = it.cases?.name || it.name;
                    const caseMethod = it.cases?.method || it.method;
                    const creatorName = it.cases?.users?.name || it.creator || 'Unknown';
                    const caseStatus = it.status || 'invited';

                    // Status color mapping
                    const statusColors = {
                      'invited': { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900', text: 'text-blue-700 dark:text-blue-300', badge: 'blue' },
                      'in_progress': { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', text: 'text-amber-700 dark:text-amber-300', badge: 'amber' },
                      'completed': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900', text: 'text-emerald-700 dark:text-emerald-300', badge: 'green' }
                    };
                    const colors = statusColors[caseStatus] || statusColors['invited'];

                    return (
                      <div
                        key={caseId}
                        className={classNames(
                          'p-4 rounded-lg border-2 cursor-pointer transition',
                          selectedCaseId === caseId ? `${colors.bg} ${colors.border} shadow-md` : `border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600`
                        )}
                        onClick={() => setSelectedCaseId(caseId)}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white shrink-0">
                            <Icon name="target" className="w-5 h-5"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50 truncate">{caseName}</div>
                            <div className="text-[11px] text-ink-500 dark:text-ink-400 truncate">Dari {creatorName}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <MethodBadge method={caseMethod}/>
                          <Badge tone={colors.badge}>
                            {caseStatus === 'completed' ? 'Selesai' : caseStatus === 'in_progress' ? 'Mengisi' : 'Diundang'}
                          </Badge>
                        </div>

                        <div className={classNames('text-[11px] mb-3 px-2 py-1.5 rounded', colors.text, colors.bg)}>
                          <div className="font-medium">
                            {days <= 7 && days > 0 && `⏰ ${days} hari lagi · ${ddl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                            {days <= 0 && '❌ Deadline terlewat'}
                            {days > 7 && `📅 ${ddl.toLocaleDateString('id-ID')} · ${ddl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                          </div>
                        </div>

                        <Button size="sm" className="w-full" iconRight="arrowR"
                          onClick={(e) => { e.stopPropagation(); go({ screen: 'expert-fill', caseId }); }}>
                          {caseStatus === 'completed' ? 'Lihat' : caseStatus === 'invited' ? 'Mulai' : 'Lanjutkan'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Case details sidebar */}
            {selectedCase ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-[16px] text-ink-900 dark:text-ink-50">Detail Kasus</h3>
                    <button onClick={() => setSelectedCaseId(null)} className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-300">
                      <Icon name="close" className="w-4 h-4"/>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold">Nama</div>
                      <div className="text-[13.5px] text-ink-900 dark:text-ink-50 font-medium">{selectedCase.cases?.name || selectedCase.name}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold">Metode</div>
                      <MethodBadge method={selectedCase.cases?.method || selectedCase.method}/>
                    </div>

                    <div>
                      <div className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold">Pembuat</div>
                      <div className="text-[13px] text-ink-700 dark:text-ink-300">{selectedCase.cases?.users?.name || selectedCase.creator || 'Unknown'}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold">Deadline</div>
                      <div className="text-[13px] text-ink-700 dark:text-ink-300 font-medium">
                        {new Date(selectedCase.cases?.deadline || selectedCase.deadline).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {selectedCase.cases?.description && (
                      <div>
                        <div className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold mb-1">Deskripsi</div>
                        <div className="text-[12px] text-ink-600 dark:text-ink-400 leading-relaxed">{selectedCase.cases.description}</div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4 bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/60 dark:border-brand-900">
                  <Badge tone="brand" icon="info">Pengingat CR</Badge>
                  <p className="text-[12px] text-brand-900/80 dark:text-brand-200/80 mt-2">Pastikan Consistency Ratio ≤ 0.10 untuk hasil yang valid.</p>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Cara Kerja</h3>
                  <ol className="space-y-2.5 text-[12.5px] text-ink-600 dark:text-ink-300">
                    {[
                      { t:'Buka kasus', d:'Pilih kasus yang diundang dari daftar.' },
                      { t:'Banding pasangan', d:'Bandingkan kepentingan tiap pasangan kriteria/alternatif.' },
                      { t:'Periksa konsistensi', d:'Sistem menghitung CR — pertahankan ≤ 0.10.' },
                      { t:'Kirim', d:'Penilaian Anda dikirim ke pembuat kasus untuk diagregasi.' },
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 grid place-items-center rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-[11px] font-bold mt-0.5">{i+1}</span>
                        <div>
                          <div className="font-semibold text-ink-800 dark:text-ink-100">{s.t}</div>
                          <div className="text-ink-500 dark:text-ink-400">{s.d}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>

                <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900">
                  <Badge tone="green" icon="check">Privasi</Badge>
                  <p className="text-[12.5px] text-emerald-900/80 dark:text-emerald-200/80 mt-2 leading-relaxed">
                    Penilaian individual Anda <b>tidak dibagikan</b> ke pakar lain.
                    Pembuat kasus hanya melihat agregasi & tingkat konsistensi.
                  </p>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// =====================================================
// Expert Filling — pairwise matrix interface
// =====================================================
function ExpertFill({ go, theme, onToggleTheme, onSwitchRole, user, caseId }) {
  console.log('[ExpertFill] Props received:', { caseId, user: user?.email });

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (caseId) {
          const data = await window.casesService.getCaseById(caseId);
          setCaseData(data);
          // Load saved judgments from localStorage
          const saved = localStorage.getItem(`judgments:${caseId}`);
          if (saved) {
            const parsedJudgments = JSON.parse(saved);
            setJudgments(parsedJudgments);
          }
          setLoading(false);
        } else {
          setLoading(false);
        }
        // Get current user ID
        const userData = await window.authService.getMe();
        setCurrentUserId(userData.id);
      } catch (error) {
        console.error('[ExpertFill] Error:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchCaseData();
  }, [caseId]);

  // Only use MOCK_CASE if no caseId provided (shouldn't happen in normal flow)
  const c = caseData || (caseId ? { criteria: [], alternatives: [] } : MOCK_CASE);

  // levels: goal, criteria, sub-criteria, each criterion has alts comparison
  const levels = useMemo(() => {
    if (!c || !c.criteria) return [];
    const arr = [
      { id: 'crit', label: 'Kriteria vs Goal', items: c.criteria, parentName: c.goal || 'Goal', kind:'criteria' },
    ];
    c.criteria.forEach(cr => {
      if (cr.subs && cr.subs.length > 0) {
        arr.push({ id: 'sub-' + cr.id, label: 'Sub-Kriteria · ' + cr.name, items: cr.subs, parentName: cr.name, kind:'subs' });
      }
    });
    c.criteria.forEach(cr => {
      arr.push({ id: 'alt-' + cr.id, label: 'Alternatif · ' + cr.name, items: c.alternatives, parentName: cr.name, kind:'alts' });
    });
    return arr;
  }, [c]);

  // Pre-fill some levels with consistent mock judgments to demonstrate progress
  const seedJudgments = (items, biases) => {
    const n = items.length;
    const out = {};
    for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
      const r = (biases[i] / biases[j]);
      // map ratio to nearest Saaty step
      let best = 1, bestErr = Infinity;
      SAATY_STEPS.forEach(s => { const e = Math.abs(Math.log(s) - Math.log(r)); if (e < bestErr) { bestErr = e; best = s; } });
      out[`${i}-${j}`] = best;
    }
    return out;
  };

  const initialState = useMemo(() => {
    const st = {};
    if (!c || !c.criteria) return st;

    // Don't pre-fill for real cases — let expert fill from scratch
    // Only pre-fill if using MOCK_CASE for demo purposes
    if (c === MOCK_CASE && c.altWeightsByCrit) {
      st['crit'] = seedJudgments(c.criteria, c.criteria.map(cr => cr.weight || 1));
      c.criteria.forEach(cr => {
        const subId = 'sub-' + cr.id;
        const altId = 'alt-' + cr.id;
        if (cr.subs && cr.subs.length > 0) {
          st[subId] = seedJudgments(cr.subs, cr.subs.map(() => 1));
        }
        if (c.altWeightsByCrit && c.altWeightsByCrit[cr.id]) {
          st[altId] = seedJudgments(c.alternatives, c.altWeightsByCrit[cr.id]);
        }
      });
    }
    return st;
  }, [c]);

  const [judgments, setJudgments] = useState(initialState);
  const [historyStack, setHistoryStack] = useState([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeLevel, setActiveLevel] = useState('crit');
  const [showSubmit, setShowSubmit] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [autoSaveEnabled] = useState(true);

  const setLevel = (lid, vals) => {
    const newJudgments = { ...judgments, [lid]: vals };
    setJudgments(newJudgments);

    // Add to history (limit to 10 changes to avoid memory issues)
    const newHistory = historyStack.slice(0, historyIndex + 1);
    newHistory.push(newJudgments);
    if (newHistory.length > 11) newHistory.shift();
    setHistoryStack(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo last change
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setJudgments(historyStack[prevIndex]);
    }
  };

  const canUndo = historyIndex > 0;

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !caseId) return;
    const interval = setInterval(() => {
      try {
        localStorage.setItem(`judgments:${caseId}`, JSON.stringify(judgments));
        setLastSaveTime(new Date());
        console.log('[ExpertFill] Auto-saved at', new Date().toLocaleTimeString('id-ID'));
      } catch (error) {
        console.error('[ExpertFill] Auto-save failed:', error);
      }
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [judgments, caseId, autoSaveEnabled]);

  // Keyboard shortcut for undo (Ctrl+Z)
  useEffect(() => {
    const handleKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [canUndo, historyIndex, historyStack]);

  const levelStatus = (lid) => {
    const lv = levels.find(l => l.id === lid);
    if (!lv) return 'none';
    const j = judgments[lid] || {};
    const total = (lv.items.length * (lv.items.length - 1)) / 2;
    const filled = Object.keys(j).length;
    if (filled === 0) return 'none';
    if (filled < total) return 'part';
    return 'ok';
  };
  const totalProgress = useMemo(() => {
    let totalCells = 0, filledCells = 0;
    levels.forEach(lv => {
      const t = (lv.items.length * (lv.items.length - 1)) / 2;
      totalCells += t;
      filledCells += Object.keys(judgments[lv.id] || {}).length;
    });
    return { filled: filledCells, total: totalCells, pct: filledCells / totalCells };
  }, [judgments, levels]);

  const lv = levels.find(l => l.id === activeLevel);
  const lvJudg = judgments[activeLevel] || {};
  console.log('[ExpertFill] Current level:', activeLevel, 'Judgments stored:', Object.keys(lvJudg).length, 'Expected:', lv?.items.length > 0 ? (lv.items.length * (lv.items.length - 1)) / 2 : 0, 'Values:', lvJudg);

  // Determine mode based on case method
  const isFuzzy = c?.method && (c.method.includes('Fuzzy'));
  const isANP = c?.method && (c.method === 'ANP' || c.method === 'Fuzzy ANP');
  const mode = isFuzzy ? 'fuzzy' : 'saaty';

  // Build matrix based on mode
  const lvMatrix = useMemo(() => {
    if (isFuzzy) {
      // For fuzzy, lvJudg contains TFN values [l,m,u], create TFN matrix
      const n = lv?.items.length || 0;
      const tfnMatrix = Array.from({ length: n }, () => Array(n).fill([1,1,1]));
      for (let i = 0; i < n; i++) {
        tfnMatrix[i][i] = [1,1,1];
        for (let j = i + 1; j < n; j++) {
          const tfn = lvJudg[`${i}-${j}`] || [1,1,1];
          tfnMatrix[i][j] = tfn;
          tfnMatrix[j][i] = [1/tfn[2], 1/tfn[1], 1/tfn[0]]; // reciprocal
        }
      }
      return tfnMatrix;
    } else {
      return buildMatrix(lv?.items.length || 0, lvJudg);
    }
  }, [lv, lvJudg, isFuzzy]);

  const allFilled = Object.keys(lvJudg).length === (lv.items.length * (lv.items.length - 1)) / 2;

  // Calculate CR based on mode
  const lvCR = useMemo(() => {
    if (!lv || lv.items.length < 3) return null;
    if (isFuzzy) {
      // For fuzzy, calculate CR from defuzzified matrix
      const defuzzifiedMatrix = lvMatrix.map(row =>
        row.map(tfn => (tfn[0] + tfn[1] + tfn[2]) / 3)
      );
      return ahpCRfromMatrix(defuzzifiedMatrix);
    } else {
      return ahpCRfromMatrix(lvMatrix);
    }
  }, [lvMatrix, lv, isFuzzy]);

  // Calculate weights based on mode
  const lvWeights = useMemo(() => {
    if (!lv || lv.items.length < 2) return null;
    if (isFuzzy) {
      return window.fuzzyPriorities(lvMatrix);
    } else {
      return ahpPriorities(lvMatrix);
    }
  }, [lvMatrix, lv, isFuzzy]);

  // Calculate overall CR from all levels with 3+ items
  const overallCR = useMemo(() => {
    const crs = [];
    levels.forEach(level => {
      if (level.items.length >= 3) {
        const jdg = judgments[level.id] || {};
        let m;
        if (isFuzzy) {
          const n = level.items.length;
          const tfnMatrix = Array.from({ length: n }, () => Array(n).fill([1,1,1]));
          for (let i = 0; i < n; i++) {
            tfnMatrix[i][i] = [1,1,1];
            for (let j = i + 1; j < n; j++) {
              const tfn = jdg[`${i}-${j}`] || [1,1,1];
              tfnMatrix[i][j] = tfn;
              tfnMatrix[j][i] = [1/tfn[2], 1/tfn[1], 1/tfn[0]];
            }
          }
          m = tfnMatrix.map(row => row.map(tfn => (tfn[0] + tfn[1] + tfn[2]) / 3));
        } else {
          m = buildMatrix(level.items.length, jdg);
        }
        const cr = ahpCRfromMatrix(m);
        if (cr) crs.push(cr.CR);
      }
    });
    return crs.length > 0 ? crs.reduce((a,b) => a+b) / crs.length : 0;
  }, [judgments, levels, isFuzzy]);

  const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);

  const goToNextLevel = () => {
    const idx = levels.findIndex(l => l.id === activeLevel);
    if (idx < levels.length - 1) setActiveLevel(levels[idx + 1].id);
    else setShowSubmit(true);
  };
  const goToPrevLevel = () => {
    const idx = levels.findIndex(l => l.id === activeLevel);
    if (idx > 0) setActiveLevel(levels[idx - 1].id);
  };

  // sidebar tree status
  const critStatusByLevel = (cid) => {
    const subSt = levelStatus('sub-' + cid);
    const altSt = levelStatus('alt-' + cid);
    const sts = [subSt, altSt].filter(Boolean);
    if (sts.every(s => s === 'ok')) return 'ok';
    if (sts.some(s => s === 'ok' || s === 'part')) return 'part';
    return 'none';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950 items-center justify-center">
        <div className="text-center">
          <div className="text-ink-600 dark:text-ink-300">Memuat data kasus...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950 items-center justify-center">
        <div className="text-center">
          <div className="text-rose-600 dark:text-rose-400 font-semibold mb-2">Error</div>
          <div className="text-ink-600 dark:text-ink-300 mb-4">{error}</div>
          <Button variant="secondary" onClick={() => go({ screen: 'expert-dashboard' })}>Kembali ke Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar items={EXPERT_NAV} active="cases" onChange={(item) => {
        switch(item) {
          case 'dashboard': go({ screen: 'expert-dashboard' }); break;
          case 'cases': go({ screen: 'expert-dashboard' }); break;
          case 'profile': go({ screen: 'expert-dashboard', tab: 'profile' }); break;
        }
      }}/>
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar with case header */}
        <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 sticky top-0 z-20">
          <TopBar
            breadcrumbs={['Kasus Saya', c.name]}
            title={c.name}
            theme={theme} onToggleTheme={onToggleTheme}
            onSwitchRole={onSwitchRole} role="expert"
            actions={
              <>
                <MethodBadge method={c.method}/>
                <Button variant="ghost" size="sm" icon="arrowL" onClick={() => go({ screen: 'expert-dashboard' })}>Kembali</Button>
              </>
            }
          />
          {/* progress strip with auto-save status (Improvement 8) */}
          <div className="px-6 py-3 flex items-center gap-4 text-[12px] border-t border-ink-100 dark:border-ink-800">
            <span className="text-ink-500">Progress keseluruhan</span>
            <div className="flex-1 h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden max-w-md">
              <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all" style={{ width: `${totalProgress.pct * 100}%` }}/>
            </div>
            <span className="font-mono tabular-nums text-ink-700 dark:text-ink-200 font-semibold">{totalProgress.filled} / {totalProgress.total}</span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-500">deadline <b className="text-rose-600">{c.deadline || 'N/A'}</b></span>
            {lastSaveTime && (
              <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-700 dark:text-emerald-300">
                <Icon name="check" className="w-3 h-3"/>
                Draft tersimpan {lastSaveTime.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-0 min-h-0">
          {/* Left rail: hierarchy nav */}
          <aside className="border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 space-y-4 overflow-y-auto">
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">Navigasi Level</div>
              <div className="space-y-0.5">
                {/* GOAL → criteria */}
                <LevelButton
                  label="Goal vs Kriteria"
                  sub="Bandingkan kriteria"
                  status={levelStatus('crit')}
                  active={activeLevel === 'crit'}
                  onClick={() => setActiveLevel('crit')}
                  level={0}
                />
                {/* per criterion → subs + alts */}
                {c.criteria.map(cr => {
                  const subId = 'sub-' + cr.id;
                  const altId = 'alt-' + cr.id;
                  const hasSubs = (cr.subs || []).length > 0;
                  return (
                    <div key={cr.id}>
                      <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-ink-600 dark:text-ink-300 flex items-center gap-1.5">
                        <Icon name="branch" className="w-3 h-3 text-ink-400"/>
                        {cr.name}
                        <span className={classNames(
                          'ml-auto w-1.5 h-1.5 rounded-full',
                          critStatusByLevel(cr.id) === 'ok' ? 'bg-emerald-500' :
                          critStatusByLevel(cr.id) === 'part' ? 'bg-amber-500' : 'bg-ink-300 dark:bg-ink-600'
                        )}/>
                      </div>
                      {hasSubs && (
                        <LevelButton label={`Sub-Kriteria · ${cr.name}`} sub="Bandingkan sub" status={levelStatus(subId)} active={activeLevel === subId} onClick={() => setActiveLevel(subId)} level={1}/>
                      )}
                      <LevelButton label={`Alternatif · ${cr.name}`} sub="Bandingkan vendor" status={levelStatus(altId)} active={activeLevel === altId} onClick={() => setActiveLevel(altId)} level={1}/>
                    </div>
                  );
                })}
              </div>
            </div>
            <SaatyLegendCard/>
          </aside>

          {/* Main: matrix */}
          <main className="p-6 min-w-0 anim-fade">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Tahap Penilaian</div>
                <h2 className="font-serif text-[26px] text-ink-900 dark:text-ink-50 leading-tight">{lv.label}</h2>
                <p className="text-[12.5px] text-ink-500 dark:text-ink-400">
                  Bandingkan tiap pasangan {lv.kind === 'criteria' ? 'kriteria' : lv.kind === 'subs' ? 'sub-kriteria' : 'alternatif'} relatif terhadap <b>{lv.parentName}</b>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lvCR && <ConsistencyIndicator cr={lvCR.CR} compact/>}
                <Badge tone="brand">{Object.keys(lvJudg).length} / {lv.items.length * (lv.items.length - 1) / 2}</Badge>
              </div>
            </div>

            {/* Mode = saaty for AHP, fuzzy for Fuzzy AHP/ANP */}
            <Card className="p-4">
              <PairwiseMatrix
                items={lv.items}
                values={lvJudg}
                onChange={(v) => setLevel(activeLevel, v)}
                mode={mode}
              />
            </Card>

            {/* Helper / instructions */}
            <Card className="p-4 mt-4 bg-ink-50/40 dark:bg-ink-950/40 border-ink-200/80">
              <div className="flex items-start gap-3">
                <Icon name="info" className="w-5 h-5 text-brand-600 mt-0.5 shrink-0"/>
                <div className="text-[12.5px] text-ink-600 dark:text-ink-300 leading-relaxed">
                  {isFuzzy ? (
                    <>
                      <b className="text-ink-800 dark:text-ink-100">Petunjuk Fuzzy:</b> Atur tiga nilai (lower, mode, upper) untuk menangkap ketidakpastian Anda.
                      <ul className="mt-2 ml-4 list-disc">
                        <li><b>Lower (L)</b>: Nilai minimum (paling pesimis)</li>
                        <li><b>Mode (M)</b>: Nilai yang paling mungkin (penilaian utama Anda)</li>
                        <li><b>Upper (U)</b>: Nilai maksimum (paling optimis)</li>
                      </ul>
                      Pastikan L ≤ M ≤ U. Nilai reciprocal di bawah diagonal otomatis terisi.
                    </>
                  ) : (
                    <>
                      <b className="text-ink-800 dark:text-ink-100">Petunjuk Saaty:</b> geser slider ke kanan jika item baris lebih dominan, ke kiri jika kolom lebih dominan.
                      Sel diagonal otomatis bernilai 1; nilai di bawah diagonal otomatis terisi sebagai 1/x. Sistem memvalidasi konsistensi setelah seluruh sel terisi.
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Nav */}
            <div className="flex items-center justify-between mt-5">
              <Button variant="ghost" icon="chevronL" onClick={goToPrevLevel} disabled={levels.findIndex(l=>l.id===activeLevel)===0}>Level sebelumnya</Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" icon="undo" onClick={handleUndo} disabled={!canUndo} title="Batalkan perubahan terakhir (Ctrl+Z)">Batalkan</Button>
                <Button variant="secondary" icon="save" onClick={() => {
                  try {
                    localStorage.setItem(`judgments:${caseId}`, JSON.stringify(judgments));
                    console.log('[ExpertFill] Judgments saved to localStorage:', judgments);
                    go({ toast: 'Penilaian disimpan' });
                  } catch (error) {
                    console.error('[ExpertFill] Failed to save:', error);
                    go({ toast: 'Gagal menyimpan penilaian' });
                  }
                }}>Simpan</Button>
                {levels.findIndex(l=>l.id===activeLevel) === levels.length - 1 ? (
                  <Button icon="send" variant="success" onClick={() => setShowSubmit(true)} disabled={!allFilled}>Selesai & Kirim</Button>
                ) : (
                  <Button iconRight="chevronR" onClick={goToNextLevel} disabled={!allFilled}>Simpan & Lanjut</Button>
                )}
              </div>
            </div>

            {/* Bottom: live priority preview & analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <Card className="p-4">
                <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Bobot Lokal (Real-time)</div>
                {lvWeights ? (
                  <WeightBarChart
                    data={lv.items.map((it, i) => ({ name: it.name, weight: lvWeights[i], color: ['#6366f1','#0ea5e9','#10b981','#f59e0b','#a855f7','#ef4444'][i % 6] }))}
                    height={200}
                  />
                ) : (
                  <div className="p-4 placeholder-stripes border-dashed text-center text-[12px] text-ink-500 italic rounded">
                    Lengkapi seluruh sel untuk melihat bobot lokal.
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Konsistensi & CR</div>
                {lv.items.length < 3 ? (
                  <div className="p-4 placeholder-stripes border-dashed text-center text-[12px] text-ink-500 italic rounded">
                    CR hanya berlaku untuk 3+ item. Level ini hanya memiliki {lv.items.length} item.
                  </div>
                ) : lvCR ? (
                  <div className="space-y-3">
                    <ConsistencyIndicator cr={lvCR.CR}/>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">Petunjuk</div>
                      <ul className="space-y-1 text-[11px] text-ink-600 dark:text-ink-300">
                        <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"/>CR ≤ 0.10 — OK</li>
                        <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"/>0.10 &lt; CR ≤ 0.15 — Review</li>
                        <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"/>CR &gt; 0.15 — Perbaiki</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 placeholder-stripes border-dashed text-center text-[12px] text-ink-500 italic rounded">
                    Lengkapi semua sel untuk melihat CR.
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Catatan Pribadi</div>
                <textarea
                  placeholder="Tuliskan catatan atau asumsi..."
                  className="w-full min-h-[150px] text-[12px] bg-ink-50/60 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                ></textarea>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} size="md"
        title="Kirim Penilaian Anda?"
        footer={<>
          <Button variant="ghost" onClick={() => setShowSubmit(false)}>Tinjau Lagi</Button>
          <Button variant="success" icon="send" onClick={async () => {
            try {
              console.log('[ExpertFill] Submitting with:', { currentUserId, caseId, judgmentsCount: Object.keys(judgments).length });
              setShowSubmit(false);
              // Save judgments to localStorage
              localStorage.setItem(`judgments:${caseId}`, JSON.stringify(judgments));

              // Save each level's judgments to backend before final submission
              console.log('[ExpertFill] Saving judgment levels to backend...');
              for (const [levelId, levelJudgments] of Object.entries(judgments)) {
                try {
                  await window.judgmentsService.saveDraft(caseId, levelId, levelJudgments);
                  console.log('[ExpertFill] Level saved:', levelId);
                } catch (err) {
                  console.error('[ExpertFill] Error saving level:', levelId, err);
                }
              }

              // Call API to submit
              console.log('[ExpertFill] Submitting judgments...');
              const response = await window.judgmentsService.submitJudgments(currentUserId, caseId);
              console.log('[ExpertFill] Submit response:', response);
              if (response?.success === false) {
                throw new Error(response?.error?.message || 'Submit failed');
              }
              go({ screen: 'expert-dashboard', toast: 'Penilaian berhasil dikirim. Terima kasih, Pakar!' });
            } catch (error) {
              console.error('[ExpertFill] Submit failed:', error);
              go({ toast: 'Gagal mengirim penilaian: ' + (error.message || 'Unknown error') });
              setShowSubmit(true);
            }
          }}>Ya, Kirim</Button>
        </>}>
        <p className="text-[13.5px] text-ink-600 dark:text-ink-300 mb-3">
          Setelah dikirim, penilaian Anda akan dikunci dan dikirim ke pembuat kasus untuk diagregasi.
          Anda tetap dapat melihat hasil agregasi setelah seluruh pakar selesai.
        </p>
        <div className="rounded-lg bg-ink-50/60 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800 p-3 text-[12.5px] space-y-1.5">
          <div className="flex items-center justify-between"><span className="text-ink-500">Total perbandingan</span><span className="font-mono tabular-nums">{totalProgress.filled} / {totalProgress.total}</span></div>
          <div className="flex items-center justify-between"><span className="text-ink-500">Estimasi CR keseluruhan</span><span className={classNames('font-mono tabular-nums', overallCR <= 0.10 ? 'text-emerald-600' : 'text-amber-600')}>{overallCR.toFixed(3)}</span></div>
          <div className="flex items-center justify-between"><span className="text-ink-500">Waktu pengisian</span><span className="font-mono tabular-nums">{elapsedMinutes} menit</span></div>
        </div>
      </Modal>
    </div>
  );
}

function LevelButton({ label, sub, status, active, onClick, level = 0 }) {
  const dot = status === 'ok' ? 'bg-emerald-500' : status === 'part' ? 'bg-amber-500' : 'bg-ink-300 dark:bg-ink-600';
  return (
    <button onClick={onClick}
      className={classNames(
        'w-full text-left flex items-center gap-2 px-2 py-2 rounded-md transition',
        active ? 'bg-brand-50 dark:bg-brand-950/40' : 'hover:bg-ink-50 dark:hover:bg-ink-800/50',
        level === 1 && 'ml-3 pl-2 border-l border-ink-200 dark:border-ink-800',
      )}>
      <span className={classNames('w-2 h-2 rounded-full shrink-0', dot)}/>
      <div className="min-w-0 flex-1">
        <div className={classNames('text-[12.5px] font-semibold truncate', active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-800 dark:text-ink-100')}>{label}</div>
        <div className="text-[10.5px] text-ink-500 truncate">{sub}</div>
      </div>
      {active && <Icon name="chevronR" className="w-3 h-3 text-brand-600"/>}
    </button>
  );
}

// Saaty Scale Legend with Tooltips (Improvement 7)
function SaatyLegendCard() {
  const [hoveredScale, setHoveredScale] = useState(null);
  const scales = [
    { value: 9, label: 'Mutlak Lebih', example: 'Laptop jauh lebih cepat dari kalkulator', color: 'bg-red-50 dark:bg-red-950/30 border-red-200' },
    { value: 7, label: 'Sangat Penting', example: 'Cloud lebih aman dari lokal storage', color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200' },
    { value: 5, label: 'Lebih Penting', example: 'Framework lebih efisien dari koding manual', color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200' },
    { value: 3, label: 'Sedikit Lebih', example: 'API REST sedikit lebih mudah dari RPC', color: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200' },
    { value: 1, label: 'Sama Penting', example: 'Kedua opsi tidak ada perbedaan', color: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200' },
  ];

  return (
    <div className="rounded-lg bg-ink-50/60 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800 p-3 text-[11.5px] text-ink-600 dark:text-ink-300">
      <div className="font-semibold text-ink-800 dark:text-ink-100 mb-2 flex items-center gap-1.5">
        Skala Saaty 1–9
        <span className="text-[9px] text-ink-400">arahkan ke item untuk contoh</span>
      </div>
      <div className="space-y-1.5">
        {scales.map(scale => (
          <div
            key={scale.value}
            className="relative"
            onMouseEnter={() => setHoveredScale(scale.value)}
            onMouseLeave={() => setHoveredScale(null)}
          >
            <div className={classNames(
              'flex items-center gap-2 px-2 py-1.5 rounded-md transition cursor-help',
              hoveredScale === scale.value ? scale.color + ' border' : 'hover:bg-ink-100 dark:hover:bg-ink-800'
            )}>
              <span className="font-mono font-bold text-[11px] text-brand-600 dark:text-brand-400 w-5 text-right">{scale.value}</span>
              <span className="text-[10.5px] font-medium text-ink-700 dark:text-ink-200">{scale.label}</span>
              {scale.value % 2 === 0 && <span className="ml-auto text-[9px] text-ink-400">(antara)</span>}
            </div>
            {hoveredScale === scale.value && (
              <div className="absolute left-0 right-0 top-full mt-1 px-2 py-1.5 bg-ink-800 dark:bg-ink-700 text-white text-[10px] rounded-md z-10 pointer-events-none">
                📌 {scale.example}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2 border-t border-ink-300/40 dark:border-ink-700/40">
        <div className="text-[10px] text-ink-500 dark:text-ink-400">
          <div className="font-medium mb-0.5">💡 Tips:</div>
          <ul className="space-y-0.5 ml-3">
            <li>• Gunakan nilai 2, 4, 6, 8 untuk skala antara</li>
            <li>• Gunakan nilai resiprok (1/x) jika baris kurang penting</li>
            <li>• Ingat: konsistensi lebih penting dari presisi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ExpertDashboard, ExpertFill, EXPERT_NAV });
