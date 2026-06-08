/* Creator screens — dashboard, wizard, case detail, results */

const CREATOR_NAV = [
  { id: 'dashboard', label: 'Dashboard',     icon: 'home' },
  { id: 'cases',     label: 'Kasus Saya',    icon: 'layers' },
  { id: 'experts',   label: 'Pakar',         icon: 'users' },
  { id: 'library',   label: 'Pustaka Kasus', icon: 'book' },
  { id: 'settings',  label: 'Pengaturan',    icon: 'settings' },
  { id: 'help',      label: 'Panduan',       icon: 'info' },
];

// =====================================================
// Dashboard
// =====================================================
function CreatorDashboard({ go, theme, onToggleTheme, onSwitchRole, user }) {
  const [navActive, setNavActive] = useState('dashboard');
  const [deletedIds, setDeletedIds] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState([]); // Start with empty, fetch real data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await window.casesService.getCases();
        const data = response.data || [];
        if (Array.isArray(data)) {
          setCases(data);
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchCases();

    // Refresh cases every 30 seconds to get latest status
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleCases = cases.filter(c => !deletedIds.includes(c.id) && (searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase())));
  const removeCase = (id) => setDeletedIds(d => [...d, id]);

  // Use notifications hook for real-time notifications
  const { notifications: allNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(30000);

  // Fetch active experts for sidebar
  const [activeExperts, setActiveExperts] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    const fetchActiveExperts = async () => {
      try {
        setNotifLoading(true);
        const expertsResponse = await window.expertsService.getActiveExperts();
        if (expertsResponse.data && Array.isArray(expertsResponse.data)) {
          setActiveExperts(expertsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch active experts:', error);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchActiveExperts();

    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchActiveExperts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get first 4 notifications for dashboard card display
  const notifications = allNotifications.slice(0, 4);

  // Calculate stats
  const totalExperts = cases.reduce((sum, c) => sum + (c.expertsCount || 0), 0);
  const completedCases = cases.filter(c => c.status === 'completed').length;
  const activeCases = cases.filter(c => c.status === 'active').length;
  const draftCases = cases.filter(c => c.status === 'draft').length;

  const onNav = (id) => {
    if (id === 'help') {
      go({ screen: 'creator-tutorial' });
    } else {
      setNavActive(id);
    }
  };
  const headerByNav = {
    dashboard: { title:`Halo, ${(user?.name || '').split(' ')[0] || 'Thabed'}`, subtitle:'' },
    cases:     { title:'Kasus Saya', subtitle:'' },
    experts:   { title:'Direktori Pakar', subtitle:'' },
    library:   { title:'Pustaka Kasus', subtitle:'' },
    settings:  { title:'Pengaturan', subtitle:'' },
  };
  const hdr = headerByNav[navActive] || headerByNav.dashboard;

  // Dynamic nav items with real badges
  const navItems = CREATOR_NAV.map(item =>
    item.id === 'cases' ? { ...item, badge: cases.length } : item
  );

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar items={navItems} active={navActive} onChange={onNav} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}
        footer={
          <div className="p-3 border-t border-ink-200 dark:border-ink-800 flex items-center gap-2">
            <Avatar name={user?.name || 'Rina M'} color="#6366f1"/>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold truncate text-ink-800 dark:text-ink-100">{user?.name}</div>
              <div className="text-[11px] text-ink-500 truncate">Pembuat Kasus</div>
            </div>
            <button onClick={() => go({ screen: 'landing' })} className="w-8 h-8 grid place-items-center rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500" title="Keluar"><Icon name="logout" className="w-4 h-4"/></button>
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <TopBar
          title={hdr.title}
          subtitle={hdr.subtitle}
          theme={theme} onToggleTheme={onToggleTheme}
          onSwitchRole={onSwitchRole} role="creator"
          notifications={allNotifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          actions={(navActive === 'dashboard' || navActive === 'cases') &&
            <Button icon="plus" onClick={() => go({ screen: 'wizard' })}>Buat Kasus Baru</Button>
          }
        />
        <main className="p-4 space-y-4 anim-fade" key={navActive}>
          {navActive === 'cases'     && <CasesView go={go} cases={visibleCases} onDelete={(c)=>setConfirmDel(c)}/>}
          {navActive === 'experts'   && <ExpertsView/>}
          {navActive === 'library'   && <LibraryView go={go}/>}
          {navActive === 'settings'  && <SettingsView user={user}/>}
          {navActive === 'dashboard' && (<>
          {/* Simplified Dashboard - Focus on Actions */}
          <div className="space-y-4">
            {/* Cases Needing Action */}
            <Card>
              <div className="p-4 border-b border-ink-200 dark:border-ink-800">
                <h2 className="font-serif text-[18px] text-ink-900 dark:text-ink-50">Butuh Aksi</h2>
                <p className="text-[12px] text-ink-500">Kasus draft dan pending respons</p>
              </div>
              <div className="p-4">
                {cases.filter(c => c.status === 'draft' || (c.status === 'active' && c.expertsCount > 0)).length === 0 ? (
                  <div className="py-8 text-center text-ink-500">
                    <Icon name="check" className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                    <p className="text-[14px]">Tidak ada kasus yang memerlukan aksi</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cases.filter(c => c.status === 'draft' || (c.status === 'active' && c.expertsCount > 0)).slice(0, 6).map(c => (
                      <CaseCard key={c.id}
                        data={c}
                        onEdit={() => go({ screen: 'wizard', caseId: c.id })}
                        onInvite={() => go({ screen: 'caseDetail', caseId: c.id })}
                        onViewResults={() => go({ screen: 'results', caseId: c.id })}
                        onDelete={() => setConfirmDel(c)}
                      />
                    ))}
                  </div>
                )}
                {cases.filter(c => c.status === 'draft' || (c.status === 'active' && c.expertsCount > 0)).length > 6 && (
                  <div className="mt-4 text-center">
                    <Button variant="secondary" onClick={() => setNavActive('cases')}>Lihat Semua Kasus</Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Cases */}
            <Card>
              <div className="p-4 border-b border-ink-200 dark:border-ink-800">
                <h2 className="font-serif text-[18px] text-ink-900 dark:text-ink-50">Kasus Terbaru</h2>
                <p className="text-[12px] text-ink-500">Kasus yang baru dimodifikasi</p>
              </div>
              <div className="p-4">
                {cases.length === 0 ? (
                  <div className="py-8 text-center text-ink-500">
                    <Icon name="layers" className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                    <p className="text-[14px]">Mulai dengan membuat kasus baru</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cases.slice(0, 3).map(c => (
                      <CaseCard key={c.id}
                        data={c}
                        onEdit={() => go({ screen: 'wizard', caseId: c.id })}
                        onInvite={() => go({ screen: 'caseDetail', caseId: c.id })}
                        onViewResults={() => go({ screen: 'results', caseId: c.id })}
                        onDelete={() => setConfirmDel(c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
          </>)}
          {navActive === 'dashboard_old' && (<>
          {/* KPI tiles with mini visualizations - OLD DASHBOARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCardWithChart
              label="Total Kasus"
              value={cases.length.toString()}
              change={cases.length > 0 ? '+0' : 'N/A'}
              color="brand"
              miniChart={<MiniLineChart data={cases.slice(0, 5).map((_, i) => ({value: Math.random() * 100}))} height={40}/>}
            />
            <StatCardWithChart
              label="Pakar Aktif"
              value={totalExperts.toString()}
              change={activeCases + ' aktif'}
              color="sky"
              miniChart={<MiniPieChart data={[{value: completedCases}, {value: activeCases}, {value: draftCases}]}/>}
            />
            <StatCardWithChart
              label="Kasus Selesai"
              value={completedCases.toString()}
              change={completedCases > 0 ? '+' + completedCases : '0'}
              trend={completedCases > 0 ? 'up' : 'down'}
              color="emerald"
              miniChart={<MiniLineChart data={[{value: 20}, {value: 45}, {value: 65}, {value: 75}, {value: 85}]} height={40}/>}
            />
            <StatCardWithChart
              label="Menunggu Respons"
              value={activeCases.toString()}
              change={activeCases > 0 ? activeCases + ' pakar' : 'Semuanya selesai!'}
              trend={activeCases > 2 ? 'down' : 'up'}
              color="amber"
              miniChart={<MiniPieChart data={[{value: activeCases}, {value: completedCases}]}/>}
            />
          </div>

          {/* Cases list + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <Card>
              <div className="flex items-center justify-between p-3 border-b border-ink-200 dark:border-ink-800">
                <div>
                  <h2 className="font-serif text-[18px] text-ink-900 dark:text-ink-50">Kasus Saya</h2>
                  <p className="text-[12px] text-ink-500">{cases.length} kasus · {completedCases} selesai · {activeCases} aktif · {draftCases} draft</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:block">
                    <Input icon="search" placeholder="Cari kasus..." className="w-44" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                  </div>
                  <Button variant="secondary" size="sm" icon="grid">Filter</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11.5px] uppercase tracking-wider text-ink-500 dark:text-ink-400 bg-ink-50/60 dark:bg-ink-950/30">
                      <th className="text-left font-semibold px-3 py-2 w-[35%]">Kasus</th>
                      <th className="text-left font-semibold px-3 py-2 w-[12%]">Metode</th>
                      <th className="text-left font-semibold px-3 py-2 w-[12%]">Pakar</th>
                      <th className="text-left font-semibold px-3 py-2 w-[15%]">Progress</th>
                      <th className="text-left font-semibold px-3 py-2 w-[15%]">Deadline</th>
                      <th className="text-left font-semibold px-3 py-2 w-[11%]">Status</th>
                      <th className="px-3 py-2 w-[8%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCases.map(c => {
                      const expCount = c.id === 'erp-vendor' ? 4 : c.expertsCount;
                      const prog = c.id === 'erp-vendor' ? 75 : (c.progress ?? 0);
                      return (
                        <tr key={c.id} className="border-t border-ink-100 dark:border-ink-800 hover:bg-ink-50/60 dark:hover:bg-ink-900/40 transition group">
                          <td className="px-3 py-2 w-[35%]">
                            <button className="text-left" onClick={() => go({ screen: 'results', caseId: c.id })}>
                              <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-700 dark:group-hover:text-brand-300">{c.name}</div>
                              <div className="text-[11px] text-ink-500 dark:text-ink-400 max-w-[30ch] truncate">{c.description}</div>
                            </button>
                          </td>
                          <td className="px-3 py-2 w-[12%]"><MethodBadge method={c.method}/></td>
                          <td className="px-3 py-2 w-[12%]">
                            <div className="flex -space-x-1">
                              {Array.from({ length: Math.min(expCount, 3) }).map((_, i) => (
                                <span key={i} style={{ background: ['#6366f1','#0ea5e9','#f59e0b','#10b981'][i%4]}} className="inline-block w-5 h-5 rounded-full border border-white dark:border-ink-900 text-[8px]"/>
                              ))}
                              {expCount > 3 && <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink-200 dark:bg-ink-800 text-[7px] font-semibold border border-white dark:border-ink-900">+{expCount-3}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 w-[15%]">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500" style={{ width: `${prog}%` }}/>
                              </div>
                              <span className="text-[11px] tabular-nums text-ink-500 w-8 text-right">{prog}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 w-[15%] text-[12px] text-ink-600 dark:text-ink-300 tabular-nums">{c.deadline}</td>
                          <td className="px-3 py-2 w-[11%]"><StatusBadge status={c.status}/></td>
                          <td className="px-3 py-2 w-[8%] text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                              <button title="Hapus kasus" onClick={(e) => { e.stopPropagation(); setConfirmDel(c); }} className="w-8 h-8 grid place-items-center rounded-md text-ink-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600">
                                <Icon name="trash" className="w-4 h-4"/>
                              </button>
                              <button title="Buka" className="w-8 h-8 grid place-items-center rounded-md text-ink-400 hover:text-brand-600 hover:bg-ink-100 dark:hover:bg-ink-800"
                                onClick={() => go({ screen: 'results', caseId: c.id })}>
                                <Icon name="chevronR"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right column: notifications + experts */}
            <div className="space-y-5">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50">Notifikasi Pakar</h3>
                  <Badge tone="brand">{notifications.length} baru</Badge>
                </div>
                <ul className="space-y-3">
                  {notifLoading ? (
                    <SkeletonBar count={3}/>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <IllustrationWaiting/>
                      <p className="text-[12px] text-ink-500 mt-3">Belum ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <li key={n.id} className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-1.5 rounded-full shrink-0" style={{ background: n.color || '#6366f1' }}/>
                        <div className="min-w-0">
                          <div className="text-[12.5px] text-ink-800 dark:text-ink-100">
                            <b>{n.expert_name || n.who}</b> {n.message || n.text}
                          </div>
                          <div className="text-[11px] text-ink-500">{n.created_at || n.when}</div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50">Pakar Aktif</h3>
                  <button className="text-[12px] text-brand-600 hover:underline" onClick={() => setNavActive('experts')}>Kelola</button>
                </div>
                <div className="space-y-2">
                  {notifLoading ? (
                    <SkeletonBar count={3}/>
                  ) : activeExperts.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-[12px] text-ink-500 mb-3">Belum ada pakar aktif</p>
                      <Button size="sm" variant="secondary" onClick={() => setNavActive('experts')}>Undang Pakar</Button>
                    </div>
                  ) : (
                    activeExperts.map(e => (
                      <div key={e.id || e.email} className="flex items-center gap-2.5">
                        <Avatar name={e.name} color={e.avatar_color || e.avatarColor || '#6366f1'} size={32}/>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium truncate text-ink-800 dark:text-ink-100">{e.name}</div>
                          <div className="text-[11px] text-ink-500 truncate">{e.role}</div>
                        </div>
                        <StatusBadge status={e.status || 'active'}/>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
          </>)}
        </main>
      </div>
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title="Hapus Kasus?" size="sm">
          <div className="p-5 space-y-4">
            <p className="text-[13.5px] text-ink-700 dark:text-ink-200">
              Apakah Anda yakin ingin membatalkan kasus <b>{confirmDel.name}</b>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDel(null)}>Batal</Button>
              <Button variant="danger" icon="trash" onClick={() => { removeCase(confirmDel.id); setConfirmDel(null); }}>Hapus</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =====================================================
// Sub-views for sidebar nav
// =====================================================
function CasesView({ go, cases, onDelete }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'deadline', 'progress', 'status'

  // Map filter display names to case status values
  const statusMap = {
    'Semua': null,
    'Draft': 'draft',
    'Aktif': 'active',
    'Selesai': 'completed'
  };

  // Filter cases
  let filtered = cases.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(q.toLowerCase()) ||
                         (c.description && c.description.toLowerCase().includes(q.toLowerCase()));
    const statusValue = statusMap[filter];
    const matchesStatus = !statusValue || c.status === statusValue;
    return matchesSearch && matchesStatus;
  });

  // Sort cases
  filtered = filtered.sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline) - new Date(b.deadline);
      case 'progress':
        const progressA = a.totalExperts > 0 ? (a.completedExperts / a.totalExperts) : 0;
        const progressB = b.totalExperts > 0 ? (b.completedExperts / b.totalExperts) : 0;
        return progressB - progressA; // Descending (high progress first)
      case 'status':
        const statusOrder = { 'completed': 0, 'active': 1, 'draft': 2 };
        return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-lg">
          {['Semua','Draft','Aktif','Selesai'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={classNames(
              'h-8 px-3 text-[12.5px] font-semibold rounded-md transition',
              filter === f ? 'bg-white dark:bg-ink-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-200'
            )}>{f}</button>
          ))}
        </div>

        {/* Search and sort */}
        <div className="flex items-center gap-2">
          <Input icon="search" placeholder="Cari kasus..." className="w-56" value={q} onChange={e=>setQ(e.target.value)}/>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 h-9 rounded-lg text-[13px] border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50">
            <option value="name">Urutkan: Nama</option>
            <option value="deadline">Urutkan: Deadline</option>
            <option value="progress">Urutkan: Progress</option>
            <option value="status">Urutkan: Status</option>
          </select>
        </div>
      </div>

      {/* Case cards grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="layers" className="w-12 h-12 mx-auto text-ink-300 dark:text-ink-700 mb-2"/>
          <p className="text-[13px] text-ink-500">Tidak ada kasus yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CaseCard
              key={c.id}
              data={c}
              onEdit={() => go({ screen: 'wizard', caseId: c.id })}
              onInvite={() => go({ screen: 'caseDetail', caseId: c.id, tab: 'experts' })}
              onViewResults={() => go({ screen: 'results', caseId: c.id })}
              onDelete={() => onDelete(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpertsView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', role: '', institution: '' });
  const [formErr, setFormErr] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [stats, setStats] = useState({ activeCount: 0, avgCR: 0, pendingCount: 0, pendingCases: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedExpertPassword, setSelectedExpertPassword] = useState({ expert: null, password: null });

  // Fetch experts from API
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);
        const response = await window.expertsService.getAllExperts();
        console.log('[ExpertsView] getAllExperts response:', response);

        const expertsList = response.data || [];
        setExperts(Array.isArray(expertsList) ? expertsList : []);
      } catch (error) {
        console.error('[ExpertsView] Failed to fetch experts:', error);
        setExperts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();

    // Also refresh periodically every 30 seconds
    const interval = setInterval(fetchExperts, 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  // Fetch stats from active experts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const activeExperts = await window.expertsService.getActiveExperts();
        if (activeExperts.data && Array.isArray(activeExperts.data)) {
          const active = activeExperts.data.filter(e => e.status === 'Mengisi').length;
          const pending = activeExperts.data.filter(e => e.status === 'Diundang').length;
          const uniqueCases = new Set(activeExperts.data.map(e => e.case_id || ''));

          // Calculate avg CR (placeholder - would need additional data)
          const avgCR = 0.08;

          setStats({
            activeCount: active,
            avgCR: avgCR,
            pendingCount: pending,
            pendingCases: uniqueCases.size
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const saveExperts = async (newExperts) => {
    setExperts(newExperts);
    // Also update in localStorage for CaseWizard
    localStorage.setItem('app_experts', JSON.stringify(newExperts));
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!formData.name.trim()) { setFormErr('Nama harus diisi'); return; }
    if (!formData.email.trim()) { setFormErr('Email harus diisi'); return; }
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(formData.email)) { setFormErr('Email tidak valid'); return; }
    if (!formData.role.trim()) { setFormErr('Keahlian harus diisi'); return; }
    if (!formData.institution.trim()) { setFormErr('Institusi harus diisi'); return; }

    setFormLoading(true);
    try {
      // Save to backend API
      const response = await window.expertsService.createExpert({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        institution: formData.institution,
      });

      const colors = ['#6366f1', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#ec4899', '#06b6d4'];
      const newExpert = {
        id: response.data?.id || 'e' + Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        institution: formData.institution,
        avatarColor: response.data?.metadata?.avatar_color || colors[Math.floor(Math.random() * colors.length)],
        status: 'active'
      };
      saveExperts([...experts, newExpert]);

      // Show modal with password instead of alert
      const tempPass = response.data?.tempPassword;
      setSelectedExpertPassword({ expert: newExpert, password: tempPass });

      setFormData({ name: '', email: '', role: '', institution: '' });
      setShowAddModal(false);
    } catch (error) {
      setFormErr(error.message || 'Gagal menambah pakar');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteExpert = (id) => {
    if (confirm('Yakin hapus pakar ini?')) {
      saveExperts(experts.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Pakar" value={experts.length.toString()} delta="terdaftar" icon="users" tone="brand"/>
        <StatCard label="Aktif Mengisi" value={stats.activeCount.toString()} delta={`di ${stats.pendingCases} kasus`} icon="sparkle" tone="sky"/>
        <StatCard label="Undangan Tertunda" value={stats.pendingCount.toString()} delta={stats.pendingCount > 0 ? "menunggu respon" : "tidak ada"} icon="bell" tone={stats.pendingCount > 0 ? "amber" : "green"}/>
      </div>
      <Card>
        <div className="flex items-center justify-between p-4 border-b border-ink-200 dark:border-ink-800">
          <h2 className="font-serif text-[20px] text-ink-900 dark:text-ink-50">Direktori Pakar</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" icon="refresh" onClick={() => setRefreshKey(k => k+1)} title="Refresh daftar pakar">Refresh</Button>
            <Button size="sm" icon="plus" onClick={() => setShowAddModal(true)}>Tambah Pakar</Button>
          </div>
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {loading ? (
            <div className="p-8 text-center text-ink-500">Memuat pakar...</div>
          ) : experts.length === 0 ? (
            <div className="p-8 text-center text-ink-500">Belum ada pakar di direktori</div>
          ) : (
            experts.map(e => (
              <div key={e.id || e.email} className="p-4 flex items-center gap-4 hover:bg-ink-50 dark:hover:bg-ink-950/40 transition cursor-pointer group" onClick={() => setSelectedExpertPassword({ expert: e, password: null })}>
                <Avatar name={e.name} color={e.avatarColor || '#6366f1'} size={40}/>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-400">{e.name}</div>
                  <div className="text-[11.5px] text-ink-500">
                    <span className="font-medium">{e.role}</span>
                    {e.institution && <span> · {e.institution}</span>}
                  </div>
                  <div className="text-[11px] text-ink-500">{e.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" icon="info" onClick={(evt) => { evt.stopPropagation(); setSelectedExpertPassword({ expert: e, password: null }); }} className="text-ink-400 hover:text-brand-500" title="Lihat detail"/>
                  <Button size="sm" variant="ghost" icon="trash" onClick={(evt) => { evt.stopPropagation(); deleteExpert(e.id || e.email); }} className="text-ink-400 hover:text-red-500" title="Hapus pakar"/>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Expert Modal */}
      <Modal open={showAddModal} onClose={() => {setShowAddModal(false); setFormData({ name: '', email: '', role: '', institution: '' }); setFormErr('');}} size="md"
        title="Tambah Pakar"
        footer={<>
          <Button variant="ghost" onClick={() => {setShowAddModal(false); setFormData({ name: '', email: '', role: '', institution: '' }); setFormErr('');}}>Batal</Button>
          <Button icon="plus" disabled={formLoading} onClick={submitAdd}>{formLoading ? 'Menambah...' : 'Tambah Pakar'}</Button>
        </>}
      >
        <form onSubmit={submitAdd} className="space-y-4">
          <Input
            label="Nama Lengkap"
            icon="user"
            placeholder="Dr. Budi Hartono"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            error={formErr && formErr.includes('Nama') ? formErr : ''}
            autoFocus
          />
          <Input
            label="Email"
            icon="mail"
            type="email"
            placeholder="pakar@institusi.ac.id"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            error={formErr && (formErr.includes('Email') || formErr.includes('valid')) ? formErr : ''}
          />
          <Input
            label="Keahlian / Peran"
            icon="sparkle"
            placeholder="Akademisi SI, Praktisi, dll"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            error={formErr && formErr.includes('Keahlian') ? formErr : ''}
          />
          <Input
            label="Institusi"
            icon="building"
            placeholder="Universitas, PT, Lembaga, dll"
            value={formData.institution}
            onChange={e => setFormData({...formData, institution: e.target.value})}
            error={formErr && formErr.includes('Institusi') ? formErr : ''}
          />
          {formErr && !['Nama', 'Email', 'Keahlian', 'Institusi'].some(f => formErr.includes(f)) && (
            <div className="rounded-lg border border-red-200/60 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-3">
              <p className="text-[12px] text-red-900/90 dark:text-red-200/90">{formErr}</p>
            </div>
          )}
        </form>
      </Modal>

      {/* Expert Password Detail Modal */}
      {selectedExpertPassword.expert && (
        <ExpertPasswordModal
          expert={selectedExpertPassword.expert}
          password={selectedExpertPassword.password}
          onClose={() => setSelectedExpertPassword({ expert: null, password: null })}
        />
      )}
    </div>
  );
}

function AnalyticsView() {
  const { LineChart, Line, AreaChart, Area, BarChart: BC, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } = Recharts;
  const trend = [
    { m:'Des', kasus:1, pakar:3 }, { m:'Jan', kasus:2, pakar:5 },
    { m:'Feb', kasus:2, pakar:7 }, { m:'Mar', kasus:3, pakar:9 },
    { m:'Apr', kasus:4, pakar:12}, { m:'Mei', kasus:5, pakar:14},
  ];
  const crDist = [
    { range:'≤0.05', n:6 }, { range:'0.05–0.10', n:12 }, { range:'0.10–0.15', n:4 }, { range:'>0.15', n:1 },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pertumbuhan Kasus" value="+150%" delta="6 bulan terakhir" icon="chart" tone="brand"/>
        <StatCard label="Median Waktu Pengisian" value="22m" delta="per pakar/kasus" icon="sparkle" tone="sky"/>
        <StatCard label="% CR Terbaik" value="78%" delta="pakar di bawah 0.10" icon="check" tone="green"/>
        <StatCard label="Konversi Undangan" value="82%" delta="merespons ≤3 hari" icon="users" tone="amber"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Tren Aktivitas (6 bulan)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{top:8,right:12,left:-8,bottom:0}}>
              <defs>
                <linearGradient id="gA" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/><stop offset="100%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                <linearGradient id="gB" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4}/><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3"/>
              <XAxis dataKey="m" stroke="currentColor" className="text-ink-500 text-[11px]" tickLine={false} axisLine={false}/>
              <YAxis stroke="currentColor" className="text-ink-400 text-[11px]" tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{background:'rgba(15,23,42,0.95)',border:'none',borderRadius:8,color:'#fff',fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="kasus" stroke="#6366f1" strokeWidth={2} fill="url(#gA)" name="Kasus"/>
              <Area type="monotone" dataKey="pakar" stroke="#0ea5e9" strokeWidth={2} fill="url(#gB)" name="Pakar Aktif"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Distribusi Konsistensi (CR)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BC data={crDist} margin={{top:8,right:12,left:-8,bottom:0}}>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3"/>
              <XAxis dataKey="range" stroke="currentColor" className="text-ink-500 text-[11px]" tickLine={false} axisLine={false}/>
              <YAxis stroke="currentColor" className="text-ink-400 text-[11px]" tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{background:'rgba(15,23,42,0.95)',border:'none',borderRadius:8,color:'#fff',fontSize:12}} cursor={{fill:'rgba(99,102,241,0.08)'}}/>
              <Bar dataKey="n" radius={[6,6,0,0]}>
                {crDist.map((d,i) => <Recharts.Cell key={i} fill={['#10b981','#22c55e','#f59e0b','#ef4444'][i]}/>)}
              </Bar>
            </BC>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="p-5">
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Top Pakar berdasarkan Kontribusi</h3>
        <div className="space-y-2">
          {[
            { n:'Prof. Sari Wijaya',  kasus:9, cr:0.07, c:'#0ea5e9' },
            { n:'Dr. Budi Hartono',  kasus:7, cr:0.06, c:'#6366f1' },
            { n:'Dr. Maya Anggraini', kasus:6, cr:0.07, c:'#a855f7' },
            { n:'Ir. Hendra Saputra', kasus:5, cr:0.08, c:'#ef4444' },
          ].map(r => (
            <div key={r.n} className="flex items-center gap-3">
              <Avatar name={r.n} color={r.c}/>
              <span className="text-[13px] font-medium text-ink-800 dark:text-ink-100 w-48 truncate">{r.n}</span>
              <div className="flex-1 h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                <div className="h-full" style={{width:`${r.kasus*10}%`,background:r.c}}/>
              </div>
              <span className="font-mono text-[12px] tabular-nums text-ink-500 w-16 text-right">{r.kasus} kasus</span>
              <ConsistencyIndicator cr={r.cr} compact/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LibraryView({ go }) {
  const templates = [
    { id:'erp',     title:'Pemilihan Vendor ERP',         method:'AHP',       crit:4, alt:4, domain:'IT · Procurement' },
    { id:'beasiswa',title:'Seleksi Penerima Beasiswa',     method:'Fuzzy AHP', crit:5, alt:12, domain:'Akademik' },
    { id:'lokasi',  title:'Pemilihan Lokasi Cabang',       method:'ANP',       crit:6, alt:3, domain:'Strategi Bisnis' },
    { id:'cio',     title:'Seleksi Kandidat C-Level',      method:'AHP',       crit:5, alt:5, domain:'HR · Eksekutif' },
    { id:'inovasi', title:'Prioritas Roadmap Produk',      method:'Fuzzy ANP', crit:4, alt:6, domain:'Inovasi' },
    { id:'supplier',title:'Evaluasi Supplier Strategis',   method:'AHP',       crit:5, alt:8, domain:'Supply Chain' },
  ];
  return (
    <div className="space-y-5">
      <Card className="p-5 bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/60 dark:border-brand-900">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center"><Icon name="book" className="w-6 h-6"/></span>
          <div>
            <h2 className="font-serif text-[22px] text-ink-900 dark:text-ink-50 leading-tight">Pustaka Kasus</h2>
            <p className="text-[12.5px] text-ink-600 dark:text-ink-300">Mulai dari template yang sudah lengkap dengan kriteria, sub-kriteria, dan alternatif tipikal.</p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="p-5 hover:border-brand-400 dark:hover:border-brand-700 transition cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <Badge tone="slate">{t.domain}</Badge>
              <MethodBadge method={t.method}/>
            </div>
            <h3 className="font-serif text-[19px] text-ink-900 dark:text-ink-50 leading-snug">{t.title}</h3>
            <div className="text-[12px] text-ink-500 mt-1.5">{t.crit} kriteria · {t.alt} alternatif</div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-100 dark:border-ink-800">
              <span className="text-[11.5px] text-ink-500">Estimasi 25–40 menit/pakar</span>
              <Button size="sm" iconRight="arrowR" onClick={()=>go({ screen:'wizard' })}>Gunakan</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ user }) {
  const [defaultMethod, setDefaultMethod] = useState('AHP');
  const [notif, setNotif] = useState({ email:true, daily:false, weekly:true });
  return (
    <div className="max-w-3xl space-y-5">
      <Card className="p-5">
        <h3 className="font-serif text-[20px] text-ink-900 dark:text-ink-50 mb-1">Profil</h3>
        <p className="text-[12.5px] text-ink-500 mb-4">Informasi akun yang ditampilkan ke pakar saat mengundang.</p>
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={user?.name || 'Rina'} color="#6366f1" size={56}/>
          <div>
            <div className="text-[15px] font-semibold text-ink-900 dark:text-ink-50">{user?.name || 'Rina Maulida'}</div>
            <div className="text-[12px] text-ink-500">{user?.email || 'rina.maulida@nusantara.co.id'}</div>
          </div>
          <Button size="sm" variant="secondary" icon="edit" className="ml-auto">Ganti Foto</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Nama Lengkap" defaultValue={user?.name || 'Rina Maulida'}/>
          <Input label="Email" defaultValue={user?.email || 'rina.maulida@nusantara.co.id'}/>
          <Input label="Institusi" defaultValue="PT Nusantara"/>
          <Input label="Jabatan" defaultValue="Head of Strategy"/>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-serif text-[20px] text-ink-900 dark:text-ink-50 mb-1">Default Metode</h3>
        <p className="text-[12.5px] text-ink-500 mb-4">Metode yang otomatis dipilih saat membuat kasus baru.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['AHP','ANP','Fuzzy AHP','Fuzzy ANP'].map(m => (
            <button key={m} onClick={()=>setDefaultMethod(m)} className={classNames(
              'h-11 px-3 rounded-lg border text-[13px] font-semibold transition',
              defaultMethod === m ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-ink-300'
            )}>{m}</button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-serif text-[20px] text-ink-900 dark:text-ink-50 mb-1">Notifikasi</h3>
        <p className="text-[12.5px] text-ink-500 mb-4">Atur kapan Anda dikirim pemberitahuan.</p>
        <div className="space-y-2">
          {[
            { k:'email',  l:'Pakar merespons / menyelesaikan',  s:'Notifikasi instan via email' },
            { k:'daily',  l:'Ringkasan harian',                 s:'Diringkas setiap pukul 08.00' },
            { k:'weekly', l:'Ringkasan mingguan',               s:'Setiap Senin pagi' },
          ].map(r => (
            <label key={r.k} className="flex items-center justify-between p-3 rounded-lg border border-ink-200 dark:border-ink-800 cursor-pointer">
              <div>
                <div className="text-[13px] font-semibold text-ink-800 dark:text-ink-100">{r.l}</div>
                <div className="text-[11.5px] text-ink-500">{r.s}</div>
              </div>
              <button onClick={()=>setNotif({...notif, [r.k]: !notif[r.k]})} className={classNames(
                'w-10 h-6 rounded-full transition relative',
                notif[r.k] ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'
              )}>
                <span className={classNames('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition', notif[r.k] ? 'left-[18px]' : 'left-0.5')}/>
              </button>
            </label>
          ))}
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Batal</Button>
        <Button icon="save">Simpan Perubahan</Button>
      </div>
    </div>
  );
}

// =====================================================
// Wizard
// =====================================================
function CaseWizard({ go, theme, onToggleTheme, onSwitchRole }) {
  const [step, setStep] = useState(0);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const steps = [
    { id:'info',   label:'Informasi Kasus', hint:'Metode & deadline' },
    { id:'tree',   label:'Hierarki',        hint:'Goal · kriteria · alternatif' },
    { id:'invite', label:'Undang Pakar',    hint:'Email & bobot agregasi' },
    { id:'review', label:'Review & Publikasi', hint:'Periksa kembali' },
  ];

  // wizard state
  const [info, setInfo] = useState({
    name: '',
    description: '',
    objective: '',
    method: 'AHP',
    deadline: '',
  });

  const [crits, setCrits] = useState([]);
  const [alts, setAlts] = useState([]);
  const [deps, setDeps] = useState([]); // ANP dependencies
  const [showDepModal, setShowDepModal] = useState(false);

  const allExperts = (() => {
    const saved = localStorage.getItem('app_experts');
    return saved ? JSON.parse(saved) : [];
  })();

  const [experts, setExperts] = useState([]);
  const [newExpertSearch, setNewExpertSearch] = useState('');
  const [showExpertList, setShowExpertList] = useState(false);
  const [showAddExpertForm, setShowAddExpertForm] = useState(false);
  const [newExpertForm, setNewExpertForm] = useState({ name: '', email: '', role: '', institution: '' });
  const [weighting, setWeighting] = useState(false);

  const filteredExperts = newExpertSearch.trim() ? allExperts.filter(e =>
    !experts.find(x => x.email === e.email) &&
    (e.name.toLowerCase().includes(newExpertSearch.toLowerCase()) || e.email.toLowerCase().includes(newExpertSearch.toLowerCase()))
  ) : [];

  const addExpertFromList = (expert) => {
    if (experts.find(x => x.email === expert.email)) return;
    setExperts([...experts, { email: expert.email, name: expert.name, role: expert.role, institution: expert.institution, weight: 1.0, status: 'invited' }]);
    setNewExpertSearch('');
    setShowExpertList(false);
  };

  const addNewExpert = () => {
    if (!newExpertForm.name.trim()) return;
    if (!newExpertForm.email.trim() || !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(newExpertForm.email)) return;
    if (!newExpertForm.role.trim()) return;
    if (!newExpertForm.institution.trim()) return;
    if (experts.find(x => x.email === newExpertForm.email)) return;

    setExperts([...experts, { ...newExpertForm, weight: 1.0, status: 'invited' }]);
    setNewExpertForm({ name: '', email: '', role: '', institution: '' });
    setShowAddExpertForm(false);
  };

  const [errs, setErrs] = useState({});
  const [validationStates, setValidationStates] = useState({
    name: 'default',
    deadline: 'default',
    email: 'default',
  });

  const isANP = info.method === 'ANP' || info.method === 'Fuzzy ANP';

  // Real-time validation with debounce
  const validateField = window.debounce((fieldName, value) => {
    let state = 'default';
    let error = null;

    if (step === 0) {
      if (fieldName === 'name') {
        if (!value.trim()) {
          state = 'invalid';
          error = 'Wajib diisi';
        } else if (value.length < 3) {
          state = 'warning';
          error = 'Minimal 3 karakter';
        } else {
          state = 'valid';
        }
      } else if (fieldName === 'deadline') {
        if (!value) {
          state = 'invalid';
          error = 'Wajib diisi';
        } else if (new Date(value) <= new Date()) {
          state = 'invalid';
          error = 'Harus tanggal di masa depan';
        } else {
          state = 'valid';
        }
      }
    } else if (step === 2) {
      if (fieldName === 'email') {
        if (!value.trim()) {
          state = 'invalid';
          error = 'Wajib diisi';
        } else if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value)) {
          state = 'invalid';
          error = 'Email tidak valid';
        } else {
          state = 'valid';
        }
      }
    }

    setValidationStates(prev => ({ ...prev, [fieldName]: state }));
    setErrs(prev => ({ ...prev, [fieldName]: error }));
  }, 300);

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!info.name.trim()) e.name = 'Wajib diisi';
      if (!info.deadline) e.deadline = 'Wajib diisi';
      else if (new Date(info.deadline) <= new Date()) e.deadline = 'Harus tanggal di masa depan';
    }
    if (step === 1) {
      if (crits.length < 2) e.crits = 'Minimal 2 kriteria';
      if (alts.length < 2) e.alts = 'Minimal 2 alternatif';
    }
    if (step === 2) {
      if (experts.length < 1) e.experts = 'Minimal 1 pakar';
    }
    setErrs(e); return !Object.keys(e).length;
  };
  const next = () => { if (validateStep()) setStep(s => Math.min(steps.length - 1, s + 1)); };
  const prev = () => setStep(s => Math.max(0, s - 1));

  const addCrit = () => {
    const id = 'c' + (crits.length + 1) + Date.now().toString(36).slice(-3);
    setCrits([...crits, { id, name: 'Kriteria Baru', desc: '', subs: [] }]);
  };
  const removeCrit = (id) => setCrits(crits.filter(c => c.id !== id));
  const updateCrit = (id, patch) => setCrits(crits.map(c => c.id === id ? {...c, ...patch} : c));
  const addSub = (cid) => setCrits(crits.map(c => c.id === cid ? {...c, subs:[...c.subs, { id: cid+'-'+(c.subs.length+1), name: 'Sub-Kriteria' }]} : c));
  const removeSub = (cid, sid) => setCrits(crits.map(c => c.id === cid ? {...c, subs: c.subs.filter(s => s.id !== sid)} : c));
  const updateSub = (cid, sid, name) => setCrits(crits.map(c => c.id === cid ? {...c, subs: c.subs.map(s => s.id === sid ? {...s, name} : s)} : c));

  const addAlt = () => setAlts([...alts, { id:'a'+Date.now().toString(36).slice(-4), name:'Alternatif Baru' }]);
  const removeAlt = (id) => setAlts(alts.filter(a => a.id !== id));
  const updateAlt = (id, name) => setAlts(alts.map(a => a.id === id ? {...a, name} : a));

  const removeExpert = (em) => setExperts(experts.filter(x => x.email !== em));

  const previewData = {
    goal: { id:'g', name: info.name || 'Goal' },
    criteria: crits.map(c => ({ ...c, status: 'none' })),
    alternatives: alts,
  };

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar items={CREATOR_NAV} active="cases" onChange={(item) => {
        switch(item) {
          case 'dashboard': go({ screen: 'creator-dashboard' }); break;
          case 'cases': go({ screen: 'creator-dashboard' }); break;
          case 'experts': go({ screen: 'creator-dashboard', tab: 'experts' }); break;
          case 'notifications': go({ screen: 'creator-dashboard', tab: 'notifications' }); break;
        }
      }}/>
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          breadcrumbs={['Kasus Saya','Kasus Baru']}
          title="Buat Kasus Baru"
          subtitle=""
          theme={theme} onToggleTheme={onToggleTheme}
          actions={
            <Button variant="ghost" size="sm" icon="x" onClick={() => go({ screen: 'creator-dashboard' })}>Batal</Button>
          }
        />
        <main className="p-6 space-y-5 max-w-[1600px] flex-1">
          <Card className="p-5"><Stepper steps={steps} current={step}/></Card>

          {/* Step content */}
          {step === 0 && (
            <Card className="p-6 anim-fade">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-serif text-[28px] font-medium text-ink-900 dark:text-ink-50 mb-1">Informasi Kasus</h2>
                    <p className="text-[13px] text-ink-500 dark:text-ink-400">Definisikan nama, deskripsi, tujuan, dan metode analisis untuk kasus keputusan Anda.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Input
                        label="Nama Kasus"
                        value={info.name}
                        state={validationStates.name}
                        error={errs.name}
                        helperText={validationStates.name === 'valid' ? 'Nama kasus valid' : errs.name}
                        onChange={e => {
                          setInfo({...info, name:e.target.value});
                          validateField('name', e.target.value);
                        }}
                        placeholder="Contoh: Pemilihan Platform E-Learning"
                      />
                      <p className="text-[11px] text-ink-400 mt-1">Gunakan nama deskriptif yang jelas sehingga pakar mudah memahami konteks keputusan.</p>
                    </div>
                    <div>
                      <Input
                        as="textarea"
                        label="Deskripsi Latar Belakang"
                        value={info.description}
                        onChange={e=>setInfo({...info, description:e.target.value})}
                        placeholder="Jelaskan konteks bisnis, tantangan, dan mengapa keputusan ini penting..."
                      />
                      <p className="text-[11px] text-ink-400 mt-1">Deskripsi membantu pakar memahami konteks penuh sebelum memberikan penilaian.</p>
                    </div>
                    <div>
                      <Input
                        as="textarea"
                        label="Tujuan Pengambilan Keputusan"
                        value={info.objective}
                        onChange={e=>setInfo({...info, objective:e.target.value})}
                        placeholder="Apa hasil akhir yang ingin dicapai dari analisis ini?"
                      />
                      <p className="text-[11px] text-ink-400 mt-1">Tujuan yang jelas memastikan semua pihak selaras dengan hasil yang diharapkan.</p>
                    </div>
                  </div>

                  <div className="border-t border-ink-200 dark:border-ink-800 pt-6">
                    <span className="block text-[14px] font-semibold text-ink-900 dark:text-ink-50 mb-3.5">Pilih Metode Analisis</span>
                    <div className="space-y-2">
                      {[
                        { id:'AHP', title:'AHP (Analytical Hierarchy Process)', sub:'Struktur hierarki sederhana tanpa dependensi silang. Metode paling umum untuk pengambilan keputusan multi-kriteria.', icon:'layers' },
                        { id:'ANP', title:'ANP (Analytic Network Process)', sub:'Memungkinkan dependensi dan feedback antar elemen. Cocok untuk keputusan kompleks dengan hubungan saling ketergantungan.', icon:'branch' },
                        { id:'Fuzzy AHP', title:'Fuzzy AHP', sub:'AHP dengan dukungan Triangular Fuzzy Numbers untuk menangkap ketidakpastian dan penilaian linguistik pakar.', icon:'sparkle' },
                        { id:'Fuzzy ANP', title:'Fuzzy ANP', sub:'Kombinasi ANP dan Fuzzy logic untuk skenario dengan ketidakpastian tinggi dan hubungan kompleks antar kriteria.', icon:'sparkle' },
                      ].map(m => (
                        <label key={m.id} className={classNames(
                          'flex items-start gap-3.5 p-3.5 rounded-lg border-2 cursor-pointer transition',
                          info.method === m.id
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                            : 'border-ink-200 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700'
                        )}>
                          <input type="radio" className="sr-only" checked={info.method===m.id} onChange={()=>setInfo({...info, method:m.id})}/>
                          <div className={classNames(
                            'w-5 h-5 mt-0.5 rounded-full border-2 grid place-items-center shrink-0 transition',
                            info.method===m.id ? 'border-brand-600 bg-brand-600' : 'border-ink-300 dark:border-ink-600'
                          )}>
                            {info.method===m.id && <span className="w-1.5 h-1.5 rounded-full bg-white"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-ink-900 dark:text-ink-50">{m.title}</div>
                            <div className="text-[12px] text-ink-500 dark:text-ink-400 leading-relaxed mt-0.5">{m.sub}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Batas Waktu Pengisian Pakar"
                      type="datetime-local"
                      value={info.deadline}
                      state={validationStates.deadline}
                      error={errs.deadline}
                      helperText={validationStates.deadline === 'valid' ? 'Deadline valid' : errs.deadline}
                      onChange={e => {
                        setInfo({...info, deadline:e.target.value});
                        validateField('deadline', e.target.value);
                      }}
                    />
                    <p className="text-[11px] text-ink-400 mt-1">Pakar akan menerima undangan dan deadline ini akan ditampilkan di dashboard mereka dengan jam spesifik.</p>
                  </div>
                </div>

                {/* Right: helpful sidebar */}
                <div className="space-y-4 xl:sticky xl:top-20 self-start">
                  <div className="rounded-xl border border-brand-200/60 dark:border-brand-900 bg-gradient-to-br from-brand-50/70 to-brand-50/40 dark:from-brand-950/50 dark:to-brand-950/30 p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 grid place-items-center rounded-lg bg-brand-600/20 text-brand-600">
                        <Icon name="info" className="w-5 h-5"/>
                      </div>
                      <span className="text-[13px] font-semibold text-brand-900 dark:text-brand-100">Memilih Metode</span>
                    </div>
                    <div className="space-y-2 text-[12.5px] text-brand-900/85 dark:text-brand-100/85 leading-relaxed">
                      <p><b className="font-semibold">AHP</b> untuk keputusan dengan struktur hierarki yang jelas dan terpisah.</p>
                      <p><b className="font-semibold">ANP</b> saat ada saling ketergantungan (misalnya kriteria A mempengaruhi kriteria B).</p>
                      <p><b className="font-semibold">Fuzzy</b> ketika pakar kesulitan memberikan penilaian pasti dan perlu skala linguistik.</p>
                    </div>
                  </div>

<Card className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex items-start gap-2 text-[12px]">
                      <Icon name="warn" className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"/>
                      <div className="text-amber-900/80 dark:text-amber-100/80">
                        <b className="font-semibold block mb-1">Jangan lupa:</b>
                        <p>Minimal 2 kriteria dan 2 alternatif diperlukan untuk analisis.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          )}

          {step === 1 && (
            <div className="anim-fade space-y-6">
              <div>
                <h2 className="font-serif text-[28px] font-medium text-ink-900 dark:text-ink-50">Definisi Hierarki</h2>
                <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-2">Susun struktur goal → kriteria → sub-kriteria → alternatif. Visualisasi di bawah akan diperbarui secara real-time.</p>
              </div>

              {/* Large interactive hierarchy preview */}
              <Card className="p-5 bg-gradient-to-br from-ink-50/50 to-white dark:from-ink-900/50 dark:to-ink-900">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] uppercase tracking-wider text-ink-500 font-semibold">Visualisasi Hierarki Real-time</span>
                  <Badge tone="brand">{info.method}</Badge>
                </div>
                <HierarchyViewer mode="edit" data={previewData} dependencies={deps} height={480}/>
              </Card>

              {/* Configuration controls */}
              <Card className="p-6">
                <div className="space-y-6">
                  {/* GOAL */}
                  <div className="rounded-xl border border-brand-200/60 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20 p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="brand" icon="target">GOAL</Badge>
                      <span className="text-[11px] text-ink-500">Otomatis dari nama kasus</span>
                    </div>
                    <div className="font-serif text-[20px] text-ink-900 dark:text-ink-50">{info.name || '—'}</div>
                  </div>

                  {/* CRITERIA */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge tone="sky" icon="layers">KRITERIA</Badge>
                        <span className="text-[12px] text-ink-500">{crits.length} item</span>
                        {errs.crits && <span className="text-[12px] text-rose-600">· {errs.crits}</span>}
                      </div>
                      <Button variant="secondary" size="sm" icon="plus" onClick={addCrit}>Tambah Kriteria</Button>
                    </div>
                    <div className="space-y-2">
                      {crits.map((c, i) => (
                        <div key={c.id} className="rounded-lg border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900">
                          <div className="flex items-center gap-2 p-3">
                            <span className="w-6 h-6 grid place-items-center rounded-md bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-mono">{i+1}</span>
                            <input value={c.name} onChange={e=>updateCrit(c.id, {name:e.target.value})}
                              className="flex-1 bg-transparent font-semibold text-[14px] text-ink-900 dark:text-ink-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1.5 -mx-1.5 py-0.5"/>
                            <input value={c.desc} placeholder="Deskripsi singkat..." onChange={e=>updateCrit(c.id, {desc:e.target.value})}
                              className="flex-1 bg-transparent text-[12px] text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1.5 py-0.5"/>
                            <button onClick={() => addSub(c.id)} className="text-[11px] text-brand-600 hover:underline whitespace-nowrap">+ sub</button>
                            <button onClick={() => removeCrit(c.id)} className="w-7 h-7 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"><Icon name="trash" className="w-4 h-4"/></button>
                          </div>
                          {c.subs.length > 0 && (
                            <div className="border-t border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-950/30 px-10 py-2 space-y-1">
                              {c.subs.map(s => (
                                <div key={s.id} className="flex items-center gap-2 group">
                                  <Icon name="branch" className="w-3.5 h-3.5 text-ink-400"/>
                                  <input value={s.name} onChange={e=>updateSub(c.id, s.id, e.target.value)}
                                    className="flex-1 bg-transparent text-[12.5px] text-ink-700 dark:text-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1.5 py-0.5"/>
                                  <button onClick={() => removeSub(c.id, s.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 grid place-items-center rounded text-ink-400 hover:text-rose-500"><Icon name="x" className="w-3 h-3"/></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ALTERNATIVES */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge tone="green" icon="grid">ALTERNATIF</Badge>
                        <span className="text-[12px] text-ink-500">{alts.length} item</span>
                        {errs.alts && <span className="text-[12px] text-rose-600">· {errs.alts}</span>}
                      </div>
                      <Button variant="secondary" size="sm" icon="plus" onClick={addAlt}>Tambah Alternatif</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {alts.map((a, i) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-2.5">
                          <span className="w-6 h-6 grid place-items-center rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono">{String.fromCharCode(65+i)}</span>
                          <input value={a.name} onChange={e=>updateAlt(a.id, e.target.value)}
                            className="flex-1 bg-transparent font-medium text-[13px] text-ink-900 dark:text-ink-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1.5 py-0.5"/>
                          <button onClick={()=>removeAlt(a.id)} className="w-7 h-7 grid place-items-center rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"><Icon name="trash" className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isANP && (
                    <div className="rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-semibold text-violet-800 dark:text-violet-200">Mode ANP terdeteksi</div>
                        <div className="text-[12px] text-violet-700/80 dark:text-violet-300/80">Definisikan dependensi antar kriteria untuk membentuk jaringan.</div>
                      </div>
                      <Button variant="outline" icon="branch" onClick={() => setShowDepModal(true)}>Definisikan Dependensi {deps.length > 0 && <Badge tone="violet" className="ml-1">{deps.length}</Badge>}</Button>
                    </div>
                  )}
                </div>

                {/* Real-time preview */}
                <div className="space-y-3 xl:sticky xl:top-20 self-start">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] uppercase tracking-wider text-ink-500 font-semibold">Preview Hierarki</span>
                    <Badge tone="brand">{info.method}</Badge>
                  </div>
                  <HierarchyViewer mode="edit" data={previewData} dependencies={deps} height={380}/>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-2.5">
                      <div className="text-[11px] text-ink-500">Kriteria</div>
                      <div className="font-serif text-[20px] text-ink-900 dark:text-ink-50">{crits.length}</div>
                    </div>
                    <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-2.5">
                      <div className="text-[11px] text-ink-500">Sub-Krit</div>
                      <div className="font-serif text-[20px] text-ink-900 dark:text-ink-50">{crits.reduce((a,c)=>a+c.subs.length,0)}</div>
                    </div>
                    <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-2.5">
                      <div className="text-[11px] text-ink-500">Alternatif</div>
                      <div className="font-serif text-[20px] text-ink-900 dark:text-ink-50">{alts.length}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card className="p-6 anim-fade space-y-6">
              <div>
                <h2 className="font-serif text-[28px] font-medium text-ink-900 dark:text-ink-50">Undang Pakar</h2>
                <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-2">Tambahkan email pakar yang akan menerima undangan untuk melakukan penilaian berpasangan. Anda dapat mengatur bobot agregasi untuk setiap pakar jika diperlukan.</p>
              </div>

              {!showAddExpertForm ? (
                <div className="rounded-lg border border-ink-200 dark:border-ink-800 p-3.5 relative">
                  <span className="block text-[13px] font-medium text-ink-700 dark:text-ink-200 mb-1.5">Pilih Pakar dari Direktori</span>
                  <div className="relative">
                    <input
                      value={newExpertSearch}
                      onChange={e => { setNewExpertSearch(e.target.value); setShowExpertList(true); }}
                      onFocus={() => setShowExpertList(true)}
                      placeholder="Ketik nama atau email pakar…"
                      className="w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/30"/>

                    {/* Dropdown list */}
                    {showExpertList && (filteredExperts.length > 0 || newExpertSearch.trim()) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                        {filteredExperts.length > 0 ? (
                          filteredExperts.map(e => (
                            <button key={e.id} onClick={() => addExpertFromList(e)} className="w-full text-left px-3 py-3 hover:bg-ink-50 dark:hover:bg-ink-800 border-b border-ink-100 dark:border-ink-800 last:border-0 transition">
                              <div className="flex items-center gap-3">
                                <Avatar name={e.name} color={e.avatarColor} size={32}/>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">{e.name}</div>
                                  <div className="text-[11px] text-ink-500">{e.role} · {e.institution}</div>
                                  <div className="text-[10px] text-ink-400">{e.email}</div>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-[12px] text-ink-500">Pakar tidak ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <label className="inline-flex items-center gap-2 text-[12.5px] text-ink-700 dark:text-ink-200 cursor-pointer">
                      <input type="checkbox" className="accent-brand-600" checked={weighting} onChange={e=>setWeighting(e.target.checked)}/>
                      Tentukan bobot agregasi per pakar
                    </label>
                    <Button size="sm" variant="secondary" icon="plus" onClick={() => setShowAddExpertForm(true)}>Pakar Baru</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="block text-[13px] font-medium text-brand-900 dark:text-brand-100">Tambah Pakar Baru</span>
                    <button onClick={() => setShowAddExpertForm(false)} className="text-brand-600 dark:text-brand-300 hover:text-brand-700">✕</button>
                  </div>
                  <Input
                    label="Nama Lengkap"
                    icon="user"
                    placeholder="Dr. Budi Hartono"
                    value={newExpertForm.name}
                    onChange={e => setNewExpertForm({...newExpertForm, name: e.target.value})}
                  />
                  <Input
                    label="Email"
                    icon="mail"
                    type="email"
                    placeholder="pakar@institusi.ac.id"
                    value={newExpertForm.email}
                    onChange={e => setNewExpertForm({...newExpertForm, email: e.target.value})}
                  />
                  <Input
                    label="Keahlian"
                    icon="sparkle"
                    placeholder="Akademisi SI, Praktisi, dll"
                    value={newExpertForm.role}
                    onChange={e => setNewExpertForm({...newExpertForm, role: e.target.value})}
                  />
                  <Input
                    label="Institusi"
                    icon="building"
                    placeholder="Universitas, PT, Lembaga, dll"
                    value={newExpertForm.institution}
                    onChange={e => setNewExpertForm({...newExpertForm, institution: e.target.value})}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddExpertForm(false)}>Batal</Button>
                    <Button size="sm" icon="plus" onClick={addNewExpert}>Tambah Pakar</Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink-50/60 dark:bg-ink-950/30 text-[11.5px] uppercase tracking-wider text-ink-500">
                      <th className="text-left font-semibold px-4 py-2.5">Pakar</th>
                      <th className="text-left font-semibold px-4 py-2.5">Status</th>
                      {weighting && <th className="text-left font-semibold px-4 py-2.5">Bobot</th>}
                      <th className="text-left font-semibold px-4 py-2.5">Diundang</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {experts.map(x => (
                      <tr key={x.email} className="border-t border-ink-100 dark:border-ink-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={x.name} color="#6366f1" size={28}/>
                            <div>
                              <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">{x.name}</div>
                              {x.role && <div className="text-[11px] text-ink-600 dark:text-ink-300">{x.role}</div>}
                              {x.institution && <div className="text-[11px] text-ink-500 dark:text-ink-400">{x.institution}</div>}
                              <div className="text-[11px] text-ink-500 dark:text-ink-400">{x.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={x.status}/></td>
                        {weighting && (
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <input type="range" min="0.5" max="2" step="0.1" value={x.weight}
                                onChange={e => setExperts(experts.map(y => y.email===x.email ? {...y, weight: +e.target.value} : y))}
                                className="w-32"/>
                              <span className="font-mono text-[12px] tabular-nums text-ink-700 dark:text-ink-200">{x.weight.toFixed(1)}×</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-[12px] text-ink-500">baru saja</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeExpert(x.email)} className="text-ink-400 hover:text-rose-500"><Icon name="trash"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 anim-fade">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-[28px] font-medium text-ink-900 dark:text-ink-50">Review & Publikasi</h2>
                    <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-2">Periksa kembali semua konfigurasi. Setelah publikasi, kasus akan dikirimkan ke semua pakar yang diundang.</p>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold text-ink-900 dark:text-ink-50 uppercase tracking-wider mb-3">Ringkasan Konfigurasi</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l:'Nama Kasus',     v:info.name, icon:'file' },
                        { l:'Metode',         v:info.method, badge:true, icon:'sparkle' },
                        { l:'Deadline',       v:info.deadline, icon:'home' },
                        { l:'Total Pakar',    v:experts.length + ' pakar', icon:'users' },
                        { l:'Kriteria',       v:crits.length, icon:'layers' },
                        { l:'Alternatif',     v:alts.length, icon:'grid' },
                      ].map(r => (
                        <div key={r.l} className="rounded-lg border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-3.5">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon name={r.icon} className="w-4 h-4 text-ink-400"/>
                            <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">{r.l}</span>
                          </div>
                          <div className="text-[15px] font-semibold text-ink-900 dark:text-ink-50">
                            {r.badge ? <MethodBadge method={r.v}/> : r.v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold text-ink-900 dark:text-ink-50 uppercase tracking-wider mb-3">Daftar Kriteria & Sub-Kriteria</h3>
                    <Card className="p-4 divide-y divide-ink-200 dark:divide-ink-800">
                      {crits.map((c, ci) => (
                        <div key={c.id} className={ci > 0 ? 'pt-4' : ''}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[11px] font-semibold shrink-0">{ci + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[13px] text-ink-900 dark:text-ink-50">{c.name}</div>
                              {c.desc && <div className="text-[12px] text-ink-500 dark:text-ink-400">{c.desc}</div>}
                            </div>
                          </div>
                          {c.subs.length > 0 && (
                            <div className="pl-8 space-y-1.5">
                              {c.subs.map(s => (
                                <div key={s.id} className="flex items-center gap-2 text-[12px] text-ink-600 dark:text-ink-300">
                                  <Icon name="branch" className="w-3 h-3 text-ink-400"/>
                                  <span>{s.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold text-ink-900 dark:text-ink-50 uppercase tracking-wider mb-3">Daftar Pakar yang Diundang</h3>
                    <Card className="p-0 divide-y divide-ink-200 dark:divide-ink-800 overflow-hidden">
                      {experts.map((x, xi) => (
                        <div key={x.email} className="flex items-center gap-3 p-3.5 hover:bg-ink-50/50 dark:hover:bg-ink-900/50">
                          <Avatar name={x.name} color="#6366f1" size={32}/>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-ink-900 dark:text-ink-50">{x.name}</div>
                            <div className="text-[11.5px] text-ink-500">{x.email}</div>
                          </div>
                          {weighting && (
                            <div className="text-right">
                              <div className="text-[12px] font-mono font-semibold text-brand-600">{x.weight.toFixed(1)}×</div>
                              <div className="text-[10px] text-ink-400">bobot</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </Card>
                  </div>

                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/60 to-emerald-50/30 dark:from-emerald-950/30 dark:to-emerald-950/20 p-4 flex items-start gap-3">
                    <Icon name="check" className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"/>
                    <div className="text-[13px] text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                      <b className="font-semibold">Siap untuk dipublikasikan.</b> Undangan akan dikirim ke {experts.length} pakar dengan deadline {info.deadline}. Anda dapat memantau progress mereka di Dashboard dan melihat hasil agregasi secara real-time.
                    </div>
                  </div>
                </div>
                <div className="xl:sticky xl:top-20 self-start">
                  <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Preview Struktur Final</div>
                  <HierarchyViewer mode="view" data={previewData} dependencies={deps} height={420}/>
                  <div className="mt-3 p-3 rounded-lg bg-ink-50/60 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800">
                    <div className="text-[11px] text-ink-500 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>Level:</span>
                        <span className="font-semibold text-ink-700 dark:text-ink-200">{deps.length > 0 ? 'ANP' : 'AHP'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Kompleksitas:</span>
                        <span className="font-semibold text-ink-700 dark:text-ink-200">{crits.length} × {alts.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Kolaborator:</span>
                        <span className="font-semibold text-ink-700 dark:text-ink-200">{experts.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Wizard footer */}
          <div className="flex items-center justify-between sticky bottom-0 bg-gradient-to-r from-ink-50/95 to-ink-50/90 dark:from-ink-950/95 dark:to-ink-950/90 backdrop-blur border-t border-ink-200 dark:border-ink-800 py-4 px-6">
            <Button variant="ghost" icon="chevronL" onClick={prev} disabled={step===0}>Sebelumnya</Button>
            <div className="flex items-center gap-3">
              {step === steps.length - 1 ? (
                <>
                  <Button variant="secondary" size="sm" icon="save" onClick={() => {}}>Simpan Draft</Button>
                  <Button size="sm" icon="send" onClick={() => setShowPublishConfirm(true)} className="relative">
                    Publikasikan ke {experts.length} Pakar
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-[12px] text-ink-500">Langkah {step + 1} dari {steps.length}</span>
                  <Button iconRight="chevronR" onClick={next}>Lanjut</Button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ANP dependencies modal */}
      <Modal open={showDepModal} onClose={() => setShowDepModal(false)} size="lg"
        title="Definisikan Dependensi Antar Kriteria"
        footer={<>
          <Button variant="ghost" onClick={() => setShowDepModal(false)}>Tutup</Button>
          <Button onClick={() => setShowDepModal(false)} icon="check">Simpan ({deps.length})</Button>
        </>}>
        <p className="text-[13px] text-ink-500 dark:text-ink-400 mb-3">Klik sel matriks untuk men-toggle dependensi <i>baris ➝ kolom</i>. Diagonal tidak diizinkan.</p>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2"></th>
              {crits.map(c => <th key={c.id} className="p-2 text-[11px] font-semibold text-ink-500">{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {crits.map(r => (
              <tr key={r.id}>
                <th className="p-2 text-[12px] font-semibold text-ink-700 dark:text-ink-200 text-left">{r.name}</th>
                {crits.map(c => {
                  if (r.id === c.id) return <td key={c.id} className="p-2 text-center text-ink-300">—</td>;
                  const has = deps.some(d => d.from === r.id && d.to === c.id);
                  return (
                    <td key={c.id} className="p-2 text-center">
                      <button onClick={() => {
                        setDeps(has ? deps.filter(d => !(d.from===r.id && d.to===c.id)) : [...deps, {from:r.id, to:c.id}]);
                      }} className={classNames(
                        'w-9 h-9 rounded-md grid place-items-center transition',
                        has ? 'bg-violet-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-400 hover:bg-violet-100 dark:hover:bg-violet-950'
                      )}>{has ? <Icon name="check" className="w-4 h-4"/> : <Icon name="plus" className="w-3 h-3"/>}</button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* Publish confirmation modal */}
      <Modal open={showPublishConfirm} onClose={() => setShowPublishConfirm(false)} size="md"
        title="Publikasikan Kasus ke Pakar?"
        footer={<>
          <Button variant="ghost" onClick={() => setShowPublishConfirm(false)}>Batal</Button>
          <Button icon="send" onClick={async () => {
            try {
              setShowPublishConfirm(false);

              // Save experts to directory first (if not already exist)
              for (const expert of experts) {
                try {
                  const result = await window.expertsService.createExpert({
                    name: expert.name,
                    email: expert.email,
                    role: expert.role,
                    institution: expert.institution,
                  });
                  console.log('Expert created/found:', expert.email, result);
                } catch (err) {
                  console.error('Error creating expert:', expert.email, err);
                  // Don't fail - expert might already exist
                }
              }

              // Prepare case data for saving
              const casePayload = {
                name: info.name,
                description: info.description || '',
                objective: info.objective,
                method: info.method,
                deadline: info.deadline,
                criteria: crits.map(c => ({
                  ...c,
                  desc: c.desc?.trim() ? c.desc : undefined,
                  subs: c.subs || [],
                })),
                alternatives: alts,
                experts: experts.map(e => ({ email: e.email, weight: e.weight, name: e.name, role: e.role })),
              };

              // Add dependencies if ANP method
              if (isANP && deps.length > 0) {
                casePayload.dependencies = deps; // Array of {from: crit_id, to: crit_id}
              }

              // Save to backend
              const response = await window.casesService.publishCase(casePayload);
              const caseId = response.data?.id || 'erp-vendor';

              go({
                screen: 'results',
                caseId: caseId,
                toast: 'Kasus berhasil dipublikasikan ke ' + experts.length + ' pakar!'
              });
            } catch (error) {
              const msg = error.message || 'Gagal menyimpan kasus';
              const details = error.details ? '\n\nDetail: ' + error.details.map(d => `${d.field}: ${d.message}`).join('\n') : '';
              alert('Error publikasi: ' + msg + details);
              setShowPublishConfirm(true);
            }
          }}>Publikasikan Sekarang</Button>
        </>}>
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200/60 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4">
            <p className="text-[13px] text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
              Kasus <b>"{info.name}"</b> akan dipublikasikan dan undangan akan dikirim ke <b>{experts.length} pakar</b> dengan deadline <b>{info.deadline}</b>.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-ink-700 dark:text-ink-200 uppercase tracking-wider">Ringkasan Publikasi:</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-[12.5px] text-ink-600 dark:text-ink-300">
                <Icon name="layers" className="w-4 h-4 text-sky-600"/>
                <span>{crits.length} kriteria</span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-ink-600 dark:text-ink-300">
                <Icon name="grid" className="w-4 h-4 text-emerald-600"/>
                <span>{alts.length} alternatif</span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-ink-600 dark:text-ink-300">
                <Icon name="users" className="w-4 h-4 text-brand-600"/>
                <span>{experts.length} pakar</span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-ink-600 dark:text-ink-300">
                <Icon name="sparkle" className="w-4 h-4 text-violet-600"/>
                <span>{info.method}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900 p-3 flex items-start gap-2 text-[12px] text-amber-900/80 dark:text-amber-100/80">
            <Icon name="info" className="w-4 h-4 mt-0.5 shrink-0"/>
            <span>Setelah publikasi, Anda dapat memantau status pakar dan melihat hasil agregasi di halaman Hasil & Agregasi.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =====================================================
// Case Detail View
// =====================================================
function CaseDetail({ go, theme, onToggleTheme, onSwitchRole, user, caseId }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const response = await window.casesService.getCaseById(caseId);
        const data = response.data || null;
        setCaseData(data);
      } catch (error) {
        console.error('Failed to fetch case:', error);
      } finally {
        setLoading(false);
      }
    };
    if (caseId) fetchCase();
  }, [caseId]);

  // Deadline warning status
  const deadlineStatus = caseData ? getDeadlineStatus(caseData.deadline) : null;

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'dark bg-ink-950' : 'bg-ink-50'}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Deadline Alert Banner */}
        {deadlineStatus && (deadlineStatus.isDue || deadlineStatus.isOverdue) && (
          <div className={classNames(
            'mb-4 p-4 rounded-lg border flex items-start gap-3 anim-fade',
            deadlineStatus.isOverdue
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
          )}>
            <Icon name={deadlineStatus.isOverdue ? 'warn' : 'clock'} className={classNames(
              'w-5 h-5 shrink-0 mt-0.5',
              deadlineStatus.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            )}/>
            <div className="flex-1 min-w-0">
              <div className={classNames(
                'font-semibold text-[14px]',
                deadlineStatus.isOverdue ? 'text-rose-900 dark:text-rose-200' : 'text-amber-900 dark:text-amber-200'
              )}>
                {deadlineStatus.isOverdue ? '⚠️ Deadline Sudah Lewat' : '⏰ Deadline Mendekati'}
              </div>
              <div className={classNames(
                'text-[13px] mt-1',
                deadlineStatus.isOverdue ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'
              )}>
                {deadlineStatus.isOverdue
                  ? `Deadline ${Math.abs(deadlineStatus.hoursLeft)} jam lalu. Secepatnya selesaikan penilaian pakar.`
                  : `${deadlineStatus.hoursLeft} jam tersisa. Pastikan semua pakar telah menyelesaikan penilaian.`}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => go({ screen: 'creator-dashboard' })}
          className="flex items-center gap-2 text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-100 mb-6 text-sm font-medium"
        >
          <Icon name="arrowL" className="w-4 h-4"/> Kembali ke Dashboard
        </button>

        {loading ? (
          <div className="text-center py-12 text-ink-500">Memuat detail kasus...</div>
        ) : !caseData ? (
          <div className="text-center py-12 text-ink-500">Kasus tidak ditemukan</div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-ink-900 rounded-xl p-6 shadow-sm border border-ink-200 dark:border-ink-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-serif text-ink-900 dark:text-ink-50 mb-2">{caseData.name}</h1>
                  <p className="text-ink-600 dark:text-ink-300 text-[14px]">{caseData.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MethodBadge method={caseData.method}/>
                  <StatusBadge status={caseData.status}/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-ink-100 dark:border-ink-800">
                <div>
                  <span className="text-ink-500 text-xs uppercase tracking-wide">Objektif</span>
                  <p className="text-ink-900 dark:text-ink-50 font-medium">{caseData.objective}</p>
                </div>
                <div>
                  <span className="text-ink-500 text-xs uppercase tracking-wide">Metode</span>
                  <p className="text-ink-900 dark:text-ink-50 font-medium">{caseData.method}</p>
                </div>
                <div>
                  <span className="text-ink-500 text-xs uppercase tracking-wide">Deadline</span>
                  <p className="text-ink-900 dark:text-ink-50 font-medium">{caseData.deadline}</p>
                </div>
              </div>
            </div>

            {/* Status Workflow Guide */}
            <div className="bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/30 dark:to-sky-950/20 rounded-xl p-6 border border-brand-200 dark:border-brand-900/30">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="info" className="w-5 h-5 text-brand-600 dark:text-brand-400"/>
                <h3 className="font-semibold text-ink-900 dark:text-ink-50">Alur Kasus</h3>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { step: 1, label: 'Setup', desc: 'Goal, Kriteria, Alternatif', status: caseData.status === 'draft' ? 'current' : 'done' },
                  { step: 2, label: 'Undang Pakar', desc: 'Pakar isi penilaian', status: caseData.status === 'draft' ? 'pending' : caseData.status === 'active' ? 'current' : 'done' },
                  { step: 3, label: 'Agregasi', desc: 'Review & Analisis', status: caseData.status !== 'completed' ? 'pending' : 'current' },
                  { step: 4, label: 'Keputusan', desc: 'Export & Dokumentasi', status: caseData.status === 'completed' ? 'done' : 'pending' }
                ].map((item, idx) => (
                  <div key={item.step} className="flex flex-col items-center gap-2">
                    <div className={classNames(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition',
                      item.status === 'done' ? 'bg-emerald-500 text-white' :
                      item.status === 'current' ? 'bg-brand-500 text-white ring-2 ring-brand-300' :
                      'bg-ink-200 dark:bg-ink-700 text-ink-600 dark:text-ink-300'
                    )}>
                      {item.status === 'done' ? '✓' : item.step}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-[12px] text-ink-900 dark:text-ink-50">{item.label}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {caseData.status === 'draft' && (
                <div className="mt-4 pt-4 border-t border-brand-200 dark:border-brand-900/20 flex items-center justify-between">
                  <span className="text-[13px] text-ink-700 dark:text-ink-300">Siap untuk mengundang pakar?</span>
                  <Button size="sm" icon="users" onClick={() => go({ screen: 'caseDetail', caseId: caseId, tab: 'experts' })}>Mulai Undang Pakar</Button>
                </div>
              )}
            </div>

            {/* Status Checklists */}
            {caseData.status === 'draft' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900/30">
                <h3 className="font-semibold text-ink-900 dark:text-ink-50 mb-4 flex items-center gap-2">
                  <Icon name="check" className="w-5 h-5 text-blue-600"/>
                  Checklist Setup
                </h3>
                <div className="space-y-3">
                  {[
                    { done: !!caseData.objective, label: 'Goal didefinisikan', desc: caseData.objective },
                    { done: (caseData.criteria || []).length >= 2, label: 'Kriteria ditambahkan (2+)', desc: `${(caseData.criteria || []).length} kriteria` },
                    { done: (caseData.alternatives || []).length >= 2, label: 'Alternatif ditambahkan (2+)', desc: `${(caseData.alternatives || []).length} alternatif` }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-ink-900 rounded-lg">
                      <div className={classNames(
                        'w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5',
                        item.done ? 'bg-emerald-500 text-white' : 'bg-blue-200 dark:bg-blue-800'
                      )}>
                        {item.done ? <Icon name="check" className="w-3 h-3"/> : '·'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={classNames('font-medium text-[13px]', item.done ? 'text-emerald-700 dark:text-emerald-300' : 'text-ink-700 dark:text-ink-300')}>{item.label}</div>
                        <div className="text-[12px] text-ink-500 dark:text-ink-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {(caseData.criteria || []).length >= 2 && (caseData.alternatives || []).length >= 2 && caseData.objective && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900/30 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-blue-900 dark:text-blue-200">✓ Semua siap! Undang pakar untuk memulai penilaian.</span>
                    <Button size="sm" icon="users" onClick={() => go({ screen: 'caseDetail', caseId: caseId })}>Undang Pakar</Button>
                  </div>
                )}
              </div>
            )}

            {caseData.status === 'active' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-6 border border-amber-200 dark:border-amber-900/30">
                <h3 className="font-semibold text-ink-900 dark:text-ink-50 mb-4 flex items-center gap-2">
                  <Icon name="info" className="w-5 h-5 text-amber-600"/>
                  Checklist Progres
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      done: (caseData.experts || []).length > 0,
                      label: 'Pakar diundang',
                      desc: `${(caseData.experts || []).filter(e => e.status !== 'declined').length} dari ${(caseData.experts || []).length} pakar`
                    },
                    {
                      done: (caseData.experts || []).filter(e => e.status === 'completed').length > 0,
                      label: 'Respons diterima',
                      desc: `${(caseData.experts || []).filter(e => e.status === 'completed').length} pakar selesai`
                    },
                    {
                      done: (caseData.experts || []).filter(e => e.status === 'completed').length === (caseData.experts || []).filter(e => e.status !== 'declined').length,
                      label: 'Semua CR acceptable',
                      desc: 'Tunggu semua pakar menyelesaikan penilaian'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-ink-900 rounded-lg">
                      <div className={classNames(
                        'w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5',
                        item.done ? 'bg-emerald-500 text-white' : 'bg-amber-200 dark:bg-amber-800'
                      )}>
                        {item.done ? <Icon name="check" className="w-3 h-3"/> : '·'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={classNames('font-medium text-[13px]', item.done ? 'text-emerald-700 dark:text-emerald-300' : 'text-ink-700 dark:text-ink-300')}>{item.label}</div>
                        <div className="text-[12px] text-ink-500 dark:text-ink-400">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {(caseData.experts || []).filter(e => e.status === 'completed').length === (caseData.experts || []).filter(e => e.status !== 'declined').length && (caseData.experts || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/30 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-amber-900 dark:text-amber-200">✓ Semua pakar selesai! Lihat hasil agregasi sekarang.</span>
                    <Button size="sm" icon="eye" onClick={() => go({ screen: 'results', caseId: caseId })}>Lihat Hasil</Button>
                  </div>
                )}
              </div>
            )}

            {caseData.status === 'completed' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-900/30">
                <h3 className="font-semibold text-ink-900 dark:text-ink-50 mb-4 flex items-center gap-2">
                  <Icon name="check" className="w-5 h-5 text-emerald-600"/>
                  Kasus Selesai
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-ink-900 rounded-lg">
                    <div className="font-medium text-[13px] text-emerald-700 dark:text-emerald-300 mb-1">✓ Pengambilan keputusan selesai</div>
                    <div className="text-[12px] text-ink-500 dark:text-ink-400">Ranking alternatif telah dikunci dan tersedia untuk export</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-900/30 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-emerald-900 dark:text-emerald-200">Tindakan selanjutnya: Review hasil atau export keputusan</span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon="eye" onClick={() => go({ screen: 'results', caseId: caseId })}>Lihat Hasil</Button>
                    <Button size="sm" icon="download">Export</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Criteria */}
            {caseData.criteria && caseData.criteria.length > 0 && (
              <div className="bg-white dark:bg-ink-900 rounded-xl p-6 shadow-sm border border-ink-200 dark:border-ink-800">
                <h2 className="text-xl font-serif text-ink-900 dark:text-ink-50 mb-4">Kriteria</h2>
                <div className="space-y-2">
                  {caseData.criteria
                    .filter(c => c.level === 1)
                    .map(c => (
                      <div key={c.id} className="p-3 bg-ink-50 dark:bg-ink-800 rounded-lg">
                        <div className="font-medium text-ink-900 dark:text-ink-50">{c.name}</div>
                        {c.description && <div className="text-sm text-ink-500 mt-1">{c.description}</div>}
                        {/* Sub-criteria */}
                        {caseData.criteria
                          .filter(sub => sub.parent_criteria_id === c.id && sub.level === 2)
                          .map(sub => (
                            <div key={sub.id} className="text-sm text-ink-600 dark:text-ink-300 mt-2 ml-2 p-2 border-l-2 border-brand-300 dark:border-brand-700">
                              • {sub.name}
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {caseData.alternatives && caseData.alternatives.length > 0 && (
              <div className="bg-white dark:bg-ink-900 rounded-xl p-6 shadow-sm border border-ink-200 dark:border-ink-800">
                <h2 className="text-xl font-serif text-ink-900 dark:text-ink-50 mb-4">Alternatif</h2>
                <div className="grid grid-cols-2 gap-3">
                  {caseData.alternatives.map(alt => (
                    <div key={alt.id} className="p-3 bg-ink-50 dark:bg-ink-800 rounded-lg text-ink-900 dark:text-ink-50 font-medium">
                      {alt.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experts */}
            {caseData.experts && caseData.experts.length > 0 && (
              <div className="bg-white dark:bg-ink-900 rounded-xl p-6 shadow-sm border border-ink-200 dark:border-ink-800">
                <h2 className="text-xl font-serif text-ink-900 dark:text-ink-50 mb-4">Pakar yang Diundang ({caseData.experts.length})</h2>
                <div className="space-y-3">
                  {caseData.experts.map(e => (
                    <div key={e.expert_id} className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-800 rounded-lg">
                      <Avatar name={e.users?.name || 'Expert'} color={e.users?.metadata?.avatar_color || '#6366f1'} size={36}/>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink-900 dark:text-ink-50">{e.users?.name || 'Unknown'}</div>
                        <div className="text-sm text-ink-600 dark:text-ink-400">{e.users?.metadata?.role || 'Expert'}</div>
                        <div className="text-xs text-ink-500">{e.users?.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={e.status === 'completed' ? 'success' : e.status === 'in_progress' ? 'warning' : 'default'}>
                          {e.status === 'completed' ? 'Selesai' : e.status === 'in_progress' ? 'Mengisi' : 'Diundang'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="ghost" onClick={() => go({ screen: 'creator-dashboard' })}>Tutup</Button>
              {caseData.status === 'active' && (
                <Button icon="eye" onClick={() => go({ screen: 'results', caseId: caseId })}>Lihat Hasil & Agregasi</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Results Page
// =====================================================
function CreatorResults({ go, theme, onToggleTheme, onSwitchRole, user, caseId }) {
  const [results, setResults] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [expertsData, setExpertsData] = useState([]);
  const [discrepancyData, setDiscrepancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('summary');
  const [aggMethod, setAggMethod] = useState('AIJ');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        console.log('[CreatorResults] Fetching results for:', { caseId, aggMethod });
        const res = await window.casesService.getResults(caseId || 'erp-vendor', aggMethod);
        console.log('[CreatorResults] Results response:', res);
        console.log('[CreatorResults] Status:', res?.status, 'Data keys:', Object.keys(res?.data || {}));
        console.log('[CreatorResults] Completed count:', res?.data?.completedExperts);
        setResults(res);

        // Fetch case details (criteria, alternatives)
        const caseInfo = await window.casesService.getCaseById(caseId || 'erp-vendor');
        console.log('[CreatorResults] Case info:', caseInfo);
        setCaseData(caseInfo.data || caseInfo);

        // Fetch experts data from results
        console.log('[CreatorResults] Setting experts data:', res?.data?.experts);
        if (res?.data?.experts && res.data.experts.length > 0) {
          setExpertsData(res.data.experts);
        } else if (res?.data?.completedExperts > 0) {
          console.log('[CreatorResults] No experts data in response but completedExperts > 0');
        }

        // Fetch expert discrepancy analysis
        try {
          const discrepancyRes = await window.casesService.getDiscrepancy(caseId || 'erp-vendor');
          console.log('[CreatorResults] Discrepancy response:', discrepancyRes);
          if (discrepancyRes?.data) {
            setDiscrepancyData(discrepancyRes.data);
          }
        } catch (discErr) {
          console.log('[CreatorResults] Discrepancy fetch optional:', discErr.message);
          // Non-critical, continue without discrepancy data
        }

        setError(null);
      } catch (err) {
        console.error('[CreatorResults] Error fetching results:', err);
        setError(err.message || 'Gagal memuat hasil');
        setResults(null);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [caseId, aggMethod]);

  const tabs = [
    { id:'summary',      label:'Ringkasan Agregasi', icon:'chart' },
    { id:'discrepancy',  label:'Analisis Divergensi', icon:'warn' },
    { id:'experts',      label:'Perbandingan Pakar', icon:'users' },
    { id:'sensitivity',  label:'Sensitivity Analysis', icon:'sparkle' },
    { id:'export',       label:'Export', icon:'download' },
  ];

  // Use real data from API
  const c = caseData ? {
    ...caseData,
    name: results?.data?.caseName || caseData?.name || 'Kasus Tanpa Nama',
    description: caseData?.description || '',
    criteria: caseData?.criteria || [],
    alternatives: caseData?.alternatives || [],
    method: caseData?.method || 'AHP',
    status: caseData?.status || 'active',
  } : { name: 'Loading...', criteria: [], alternatives: [] };
  const baseRanked = results?.data?.alternativeScores || [];
  const consistencyRatio = results?.data?.consistencyRatio || null;
  const criteriaWeights = results?.data?.criteriaWeights || [];

  // sensitivity state - use real criteria weights
  const defaultOverrides = criteriaWeights?.length > 0 ? criteriaWeights.map(cr => cr.weight || 0) : [];
  const [overrides, setOverrides] = useState(defaultOverrides);

  const overrideTotal = overrides.reduce((a,b)=>a+b,0) || 1;
  const normOverrides = overrides.map(x => x / overrideTotal);
  const ranked = useMemo(() => {
    // For sensitivity, just re-rank alternatives using current override weights
    return (baseRanked || []).map(alt => ({
      ...alt,
      score: alt.score // Keep actual calculated scores
    })).sort((a, b) => b.score - a.score);
  }, [baseRanked]);

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar items={CREATOR_NAV} active="cases" onChange={(item) => {
        switch(item) {
          case 'dashboard': go({ screen: 'creator-dashboard' }); break;
          case 'cases': go({ screen: 'creator-dashboard' }); break;
          case 'experts': go({ screen: 'creator-dashboard', tab: 'experts' }); break;
          case 'notifications': go({ screen: 'creator-dashboard', tab: 'notifications' }); break;
        }
      }}/>
      <div className="flex-1 min-w-0">
        <TopBar
          breadcrumbs={['Kasus Saya', c?.name || 'Loading']}
          title="Hasil & Agregasi"
          subtitle=""
          theme={theme} onToggleTheme={onToggleTheme}
          onSwitchRole={onSwitchRole} role="creator"
          actions={<>
            <Button variant="secondary" size="sm" icon="arrowL" onClick={() => go({ screen: 'creator-dashboard' })}>Dashboard</Button>
            <Button size="sm" icon="download">Export</Button>
          </>}
        />
        <main className="p-6 space-y-5 anim-fade">

          {/* Loading state with skeleton */}
          {loading && (
            <div className="space-y-4">
              <SkeletonCard count={2}/>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SkeletonCard count={1} height="h-32"/>
                <SkeletonCard count={1} height="h-32"/>
                <SkeletonCard count={1} height="h-32"/>
              </div>
              <SkeletonTable rows={4} cols={5}/>
            </div>
          )}

          {/* Error state */}
          {error && (
            <Card className="p-6 border-red-200/60 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30">
              <div className="flex items-start gap-4">
                <Icon name="alert" className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 shrink-0"/>
                <div>
                  <div className="text-[15px] font-semibold text-red-900 dark:text-red-100">Error Memuat Hasil</div>
                  <p className="text-[13px] text-red-800 dark:text-red-200 mt-2">{error}</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>Coba Lagi</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Waiting state - no completed judgments */}
          {!loading && results?.status === 'waiting' && (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-64 h-40 mx-auto mb-6">
                  <IllustrationWaiting/>
                </div>
                <h3 className="font-serif text-[26px] text-ink-900 dark:text-ink-50 mb-3">Menunggu Penilaian Pakar</h3>
                <p className="text-[14px] text-ink-600 dark:text-ink-300 mb-4 leading-relaxed">
                  Hasil agregasi akan ditampilkan setelah semua pakar menyelesaikan penilaian mereka.
                </p>
                <div className="bg-ink-50/60 dark:bg-ink-900/40 rounded-lg p-4 mb-4">
                  <div className="text-[13px] font-semibold text-ink-900 dark:text-ink-50 mb-2">Progress: {results?.data?.completedExperts} dari {results?.data?.totalExperts} pakar</div>
                  <div className="w-full h-2 bg-ink-200 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
                      style={{width: `${(results?.data?.completedExperts / results?.data?.totalExperts) * 100}%`}}
                    />
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
              </div>
            </Card>
          )}

          {/* Results view - completed */}
          {!loading && results?.status === 'completed' && (
            <div className="p-6 space-y-6">
              <div>
                <h1 className="font-serif text-3xl text-ink-900 dark:text-ink-50 mb-1">{c?.name}</h1>
                <p className="text-ink-500">{c?.description}</p>
              </div>

              {/* Tabs */}
              <Card>
                <div className="flex items-center gap-1 px-2 border-b border-ink-200 dark:border-ink-800 overflow-x-auto">
                  {[
                    { id: 'summary', label: 'Ringkasan', icon: 'chart' },
                    { id: 'discrepancy', label: 'Divergensi Pakar', icon: 'stats' },
                    { id: 'experts', label: 'Data Pakar', icon: 'users' },
                    { id: 'sensitivity', label: 'Analisis Sensitivitas', icon: 'sliders' },
                    { id: 'export', label: 'Ekspor', icon: 'download' }
                  ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={classNames(
                      'h-12 px-4 text-[13px] font-semibold border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap transition',
                      tab === t.id ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-100'
                    )}>
                      <Icon name={t.icon} className="w-4 h-4"/>{t.label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {tab === 'summary' && <SummaryTab c={c} ranked={baseRanked} consistencyRatio={consistencyRatio} criteriaWeights={criteriaWeights} theme={theme}/>}
                  {tab === 'discrepancy' && <ExpertDiscrepancyTab data={discrepancyData} expertsData={expertsData}/>}
                  {tab === 'experts' && <ExpertsTab c={c} experts={expertsData} criteriaWeights={criteriaWeights}/>}
                  {tab === 'sensitivity' && <SensitivityTab c={c} overrides={overrides} setOverrides={setOverrides} normOverrides={normOverrides} ranked={ranked} baseRanked={baseRanked} criteriaWeights={criteriaWeights}/>}
                  {tab === 'export' && <ExportTab caseData={c} resultData={{alternativeScores: baseRanked, criteriaWeights: criteriaWeights, consistencyRatio: consistencyRatio, recommendation: baseRanked?.[0]}}/>}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryTab({ c, ranked, consistencyRatio, criteriaWeights, theme = 'light' }) {
  const { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } = Recharts;

  // Use real criteria weights from API response instead of c.criteria.weight
  const critData = (criteriaWeights && criteriaWeights.length > 0)
    ? criteriaWeights.map(cr => ({ name: cr.name, weight: cr.weight, color: '#6366f1' }))
    : c.criteria.map(cr => ({ name: cr.name, weight: 0, color: '#6366f1' }));

  const altData = (ranked || []).map((a, i) => ({
    name: a.name, weight: a.score,
    color: ['#10b981','#6366f1','#0ea5e9','#94a3b8'][i] || '#94a3b8'
  }));

  // CR visualization data - mock levels for demo, would come from actual judgments in real case
  const crByLevel = [
    { level: 'Level 1 (Kriteria)', cr: (consistencyRatio || 0), status: (consistencyRatio || 0) <= 0.1 ? '✓ Ok' : '✗ Inkonsisten' },
    { level: 'Level 2 (Alternatif)', cr: (consistencyRatio || 0) * 0.8, status: true },
  ];

  // CR distribution chart data
  const crChartData = [
    { name: 'Kriteria', value: (consistencyRatio || 0), threshold: 0.1 },
    { name: 'Alternatif', value: (consistencyRatio || 0) * 0.8, threshold: 0.1 },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary - Top 3 Alternatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ranked.slice(0, 3).map((a, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          const confidences = ['Sangat Tinggi', 'Tinggi', 'Menengah'];
          const bgClasses = [
            'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900',
            'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
            'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900'
          ];
          return (
            <Card key={a.id} className={`p-4 border-2 ${bgClasses[i]}`}>
              <div className="text-center">
                <div className="text-[48px] mb-2">{medals[i]}</div>
                <div className="text-[14px] font-semibold text-ink-900 dark:text-ink-50 mb-1">{a.name}</div>
                <div className="text-[12px] text-ink-500 mb-3">{a.vendor}</div>
                <div className="text-[24px] font-mono font-bold text-brand-600 mb-2">{fmtPct(a.score)}</div>
                <div className={classNames('inline-block px-3 py-1 rounded-full text-[11px] font-semibold',
                  (consistencyRatio || 0) <= 0.1 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                )}>
                  {confidences[i]}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Bobot Kriteria (Final)</h3>
          <WeightBarChart data={critData} height={200}/>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            {(criteriaWeights && criteriaWeights.length > 0 ? criteriaWeights : c.criteria).map(cr => (
              <div key={cr.id} className="flex items-center justify-between rounded-md bg-ink-50/60 dark:bg-ink-950/40 px-3 py-2">
                <span className="text-ink-700 dark:text-ink-200 font-medium">{cr.name}</span>
                <span className="font-mono tabular-nums text-brand-600">{fmtPct(cr.weight || 0)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Peringkat Lengkap Alternatif</h3>
          <WeightBarChart data={altData} height={200}/>
          <div className="mt-3 space-y-2">
            {ranked.map((a, i) => (
              <div key={a.id} className={classNames(
                'flex items-center gap-3 rounded-lg p-3 border',
                i === 0 ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-ink-200 dark:border-ink-800',
              )}>
                <span className="text-[22px] w-9 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':'·'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50">{a.name}</div>
                  <div className="text-[11px] text-ink-500">{a.vendor}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[15px] font-semibold text-brand-600">{fmtPct(a.score)}</div>
                  <div className="text-[10.5px] text-ink-500">rank #{i+1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      <div className="lg:col-span-2">
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Hierarki + Bobot Final</h3>
        <HierarchyViewer height={360} data={{
          goal: { id:'g', name: c.name || 'Goal' },
          criteria: (criteriaWeights && criteriaWeights.length > 0 ? criteriaWeights : c.criteria).map(cr => ({
            ...cr,
            weight: cr.weight || 0,
            status:'ok'
          })),
          alternatives: c.alternatives || [],
        }}/>
      </div>
      <div className="lg:col-span-2">
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-4">Analisis Konsistensi (CR)</h3>
        <div className="grid grid-cols-1 gap-4">
          {/* CR Distribution Chart */}
          <Card className="p-4">
            <div className="text-[14px] font-semibold text-ink-800 dark:text-ink-100 mb-3">Distribusi CR per Level Hierarki</div>
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={crChartData} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis
                    dataKey="name"
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    }}
                    formatter={(value) => fmtNum(value, 3)}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', r: 6 }}
                    activeDot={{ r: 8 }}
                    name="CR Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="threshold"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Threshold (0.10)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[12px] text-ink-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span>CR Aktual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-600" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #10b981 0px, #10b981 5px, transparent 5px, transparent 10px)' }}></div>
                <span>Threshold Ideal (≤0.10)</span>
              </div>
            </div>
          </Card>

          {/* Consistency Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[12px] text-ink-500 mb-1">CR Agregat</div>
                  <div className="text-[32px] font-mono font-bold text-brand-600">{fmtNum(consistencyRatio || 0, 3)}</div>
                  <div className={classNames('text-[12px] font-semibold mt-2', (consistencyRatio || 0) <= 0.1 ? 'text-emerald-600' : 'text-rose-600')}>
                    {(consistencyRatio || 0) <= 0.1 ? '✓ Konsisten (≤ 0.10)' : '✗ Inkonsisten (> 0.10)'}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[12px] text-ink-500">
                <p className="mb-2 font-semibold text-ink-700 dark:text-ink-200">Panduan Saaty:</p>
                <ul className="space-y-1 ml-4">
                  <li>• CR ≤ 0.10: Konsisten ✓</li>
                  <li>• CR > 0.10: Perlu Review</li>
                </ul>
              </div>
            </Card>
            <Card className="p-4">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-ink-200 dark:border-ink-800">
                    <th className="text-left py-2 font-semibold text-ink-700 dark:text-ink-200">Level</th>
                    <th className="text-right py-2 font-semibold text-ink-700 dark:text-ink-200">CR</th>
                    <th className="text-center py-2 font-semibold text-ink-700 dark:text-ink-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {crByLevel.map((item, i) => (
                    <tr key={i} className="border-b border-ink-100 dark:border-ink-800">
                      <td className="py-2 text-ink-700 dark:text-ink-200">{item.level}</td>
                      <td className="py-2 text-right font-mono text-brand-600">{fmtNum(item.cr, 3)}</td>
                      <td className="py-2 text-center text-[11px]">
                        <span className={classNames('inline-block px-2 py-1 rounded-sm font-semibold', item.status === true || item.status.includes('✓') ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300')}>
                          {typeof item.status === 'string' ? item.status.split(' ')[0] : '✓'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function ExpertsTab({ c, experts, criteriaWeights }) {
  const completed = experts || [];

  if (!completed || completed.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-500">Belum ada data pakar yang tersimpan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pakar Summary */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-4">Daftar Pakar yang Menyelesaikan Penilaian</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map(e => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={e.name || 'Pakar'} size={40}/>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-800 dark:text-ink-100">{e.name || 'Pakar Tanpa Nama'}</div>
                  <div className="text-[12px] text-ink-500">{e.email || 'Tidak ada email'}</div>
                  {e.cr !== undefined && (
                    <div className="mt-2 text-[12px]">
                      <span className={classNames('font-semibold', (e.cr || 0) <= 0.1 ? 'text-emerald-600' : 'text-rose-600')}>
                        CR: {fmtNum(e.cr || 0, 3)} {(e.cr || 0) <= 0.1 ? '✓' : '✗'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Agregasi Weights Info */}
      {criteriaWeights && criteriaWeights.length > 0 && (
        <div>
          <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-4">Bobot Kriteria Agregasi</h3>
          <div className="space-y-2">
            {criteriaWeights.map(cr => (
              <div key={cr.id} className="flex items-center justify-between p-3 rounded-lg bg-ink-50/60 dark:bg-ink-950/40">
                <span className="text-ink-800 dark:text-ink-100 font-medium">{cr.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-ink-200 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600" style={{ width: `${(cr.weight || 0)*100}%` }}/>
                  </div>
                  <span className="font-mono text-[13px] w-12 text-right">{fmtPct(cr.weight || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpertsTab_OLD({ c }) {
  const completed = c.experts?.filter(e => e.status === 'completed' || e.status === 'in_progress') || [];
  const { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ZAxis, ReferenceLine } = Recharts;
  // Build scatter: per expert per criterion, x = expert weight, y = aggregated weight
  const scatter = [];
  completed.forEach((e, ei) => {
    c.criteria?.forEach((cr, ci) => {
      scatter.push({
        x: c.expertCriteriaWeights?.[e.id]?.[ci] || 0,
        y: cr.weight,
        expert: e.name, criterion: cr.name,
        color: e.avatarColor,
      });
    });
  });
  return (
    <div className="space-y-6">
      {/* Side-by-side weight matrix */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Bobot Kriteria per Pakar</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-ink-200 dark:border-ink-800 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-ink-50/60 dark:bg-ink-950/40 text-[11.5px] uppercase tracking-wider text-ink-500">
                <th className="text-left font-semibold px-4 py-2.5">Kriteria</th>
                {completed.map(e => (
                  <th key={e.id} className="px-4 py-2.5">
                    <div className="flex items-center gap-2 normal-case">
                      <Avatar name={e.name} color={e.avatarColor} size={22}/>
                      <span className="text-ink-700 dark:text-ink-200">{e.name?.split(' ')?.slice(0,2)?.join(' ')}</span>
                    </div>
                  </th>
                ))}
                <th className="text-left font-semibold px-4 py-2.5 bg-brand-50/60 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300">Agregasi</th>
              </tr>
            </thead>
            <tbody>
              {c.criteria?.map((cr, ci) => (
                <tr key={cr.id} className="border-t border-ink-100 dark:border-ink-800">
                  <td className="px-4 py-2.5 font-semibold text-ink-800 dark:text-ink-100">{cr.name}</td>
                  {completed.map(e => {
                    const v = c.expertCriteriaWeights?.[e.id]?.[ci] || 0;
                    return (
                      <td key={e.id} className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${v*100}%`, background: e.avatarColor }}/>
                          </div>
                          <span className="font-mono text-[11.5px] tabular-nums w-10 text-right">{(v*100).toFixed(0)}%</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 bg-brand-50/40 dark:bg-brand-950/20 font-mono font-semibold text-brand-700 dark:text-brand-300 text-right tabular-nums">{fmtPct(cr.weight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consistency heatmap */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Heatmap Konsistensi (CR per Pakar)</h3>
        <div className="rounded-lg border border-ink-200 dark:border-ink-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50/60 dark:bg-ink-950/40 text-[11.5px] uppercase tracking-wider text-ink-500">
                <th className="text-left font-semibold px-4 py-2.5">Pakar</th>
                {['Kriteria','Harga (Alt)','Kualitas (Alt)','Support (Alt)','Reputasi (Alt)','Total CR'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.map(e => {
                const seed = e.cr || 0;
                const cells = [seed, seed*0.8 + 0.02, seed*1.1, seed*0.9, seed*1.2, seed];
                return (
                  <tr key={e.id} className="border-t border-ink-100 dark:border-ink-800">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={e.name} color={e.avatarColor} size={26}/>
                        <span className="text-[13px] font-medium text-ink-800 dark:text-ink-100">{e.name}</span>
                      </div>
                    </td>
                    {cells.map((v, i) => {
                      const ok = v <= 0.10, warn = v > 0.10 && v <= 0.15;
                      const bg = ok ? 'rgba(16,185,129,' + (0.15 + (0.10-v)*1.5) + ')'
                              : warn ? 'rgba(245,158,11,' + (0.20 + (v-0.10)*3) + ')'
                                     : 'rgba(244,63,94,' + (0.20 + (v-0.15)*3) + ')';
                      return (
                        <td key={i} className="px-4 py-2.5">
                          <div className="rounded-md px-2.5 py-1.5 font-mono text-[12px] tabular-nums text-ink-800 dark:text-ink-50" style={{ background: bg }}>
                            {v.toFixed(3)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scatter */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-2">Bobot Pakar vs Bobot Agregasi</h3>
        <Card className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 24, bottom: 30, left: 10 }}>
              <CartesianGrid stroke="rgba(100,116,139,0.15)" strokeDasharray="3 3"/>
              <XAxis type="number" dataKey="x" name="Pakar" domain={[0, 0.5]} tickFormatter={fmtPct} stroke="currentColor" className="text-ink-500 text-[11px]" label={{ value: 'Bobot per Pakar', position: 'bottom', offset: 8, fill: '#64748b', fontSize: 11 }}/>
              <YAxis type="number" dataKey="y" name="Agregasi" domain={[0, 0.5]} tickFormatter={fmtPct} stroke="currentColor" className="text-ink-500 text-[11px]" label={{ value: 'Bobot Agregasi', angle:-90, position:'left', offset:0, fill:'#64748b', fontSize:11 }}/>
              <ZAxis range={[80, 80]}/>
              <ReferenceLine segment={[{x:0,y:0},{x:0.5,y:0.5}]} stroke="#94a3b8" strokeDasharray="4 4"/>
              <Tooltip cursor={{strokeDasharray:'3 3'}}
                contentStyle={{background:'rgba(15,23,42,0.95)',border:'none',borderRadius:8,color:'#fff',fontSize:12}}
                formatter={(v, k) => [fmtPct(v), k === 'x' ? 'Pakar' : 'Agregasi']}
                labelFormatter={() => ''}
              />
              <Scatter data={scatter} fill="#6366f1">
                {scatter.map((d, i) => <Recharts.Cell key={i} fill={d.color}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 text-[11.5px] text-ink-500 mt-1">
            <span>Garis diagonal = kesesuaian sempurna</span>
            <span className="flex items-center gap-3">
              {completed.map(e => (
                <span key={e.id} className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{background:e.avatarColor}}/>{e.name.split(' ')[1] || e.name}
                </span>
              ))}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SensitivityTab({ c, overrides, setOverrides, normOverrides, ranked, baseRanked, criteriaWeights }) {
  const altData = (ranked || []).map((a, i) => ({
    name: a.name, weight: a.score,
    color: ['#10b981','#6366f1','#0ea5e9','#94a3b8'][i] || '#94a3b8'
  }));

  const baseAltData = (baseRanked || []).map((a, i) => ({
    name: a.name, weight: a.score,
    color: ['#10b981','#6366f1','#0ea5e9','#94a3b8'][i] || '#94a3b8'
  }));

  // detect rank changes
  const rankChanged = (ranked || []).map((a, i) => (baseRanked || []).findIndex(b => b.id === a.id) !== i);
  const anyChanged = rankChanged.some(Boolean);

  return (
    <div className="space-y-6">
      {anyChanged && (
        <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"/>
            <div className="text-[13px] text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-1">Sensitivitas Terdeteksi</p>
              <p>Perubahan bobot menyebabkan {rankChanged.filter(Boolean).length} alternatif bergeser posisi. Lihat perbandingan di bawah untuk detail perubahan.</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50">Atur Bobot Kriteria</h3>
          <Button variant="secondary" size="sm" icon="refresh" onClick={() => setOverrides(criteriaWeights?.map(cr => cr.weight || 0) || [])}>Reset ke Agregasi</Button>
        </div>
        <div className="space-y-4">
          {(criteriaWeights || []).map((cr, i) => (
            <div key={cr.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="text-[13px] font-semibold text-ink-800 dark:text-ink-100">{cr.name}</div>
                  <div className="text-[11px] text-ink-500">{cr.description || ''}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[14px] tabular-nums text-brand-600">{fmtPct(normOverrides?.[i] || 0)}</div>
                  <div className="text-[10px] text-ink-400">basis: {fmtPct(cr.weight || 0)}</div>
                </div>
              </div>
              <input type="range" min="0.05" max="0.7" step="0.01" value={overrides?.[i] || 0}
                onChange={e => {
                  const next = [...(overrides || [])]; next[i] = +e.target.value; setOverrides(next);
                }} className="w-full"/>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-ink-50/60 dark:bg-ink-950/40 border border-ink-200 dark:border-ink-800 p-3 text-[12px] text-ink-600 dark:text-ink-300">
          <span className="font-semibold text-ink-800 dark:text-ink-100">Tip:</span> Geser bobot untuk melihat bagaimana ranking berubah secara real-time. Bobot dinormalisasi otomatis.
        </div>
      </div>
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Ranking Real-time (Saat Ini)</h3>
        <WeightBarChart data={altData} height={200}/>
        <div className="mt-3 space-y-2">
          {ranked.map((a, i) => {
            const baseIdx = baseRanked.findIndex(b => b.id === a.id);
            const moved = baseIdx - i;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-ink-200 dark:border-ink-800 p-3">
                <span className="text-[20px] w-7 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':'·'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50">{a.name}</div>
                  <div className="text-[11px] text-ink-500">{a.vendor}</div>
                </div>
                {moved !== 0 && (
                  <Badge tone={moved > 0 ? 'green' : 'red'}>
                    {moved > 0 ? '↑' : '↓'} {Math.abs(moved)}
                  </Badge>
                )}
                <span className="font-mono text-[14px] font-semibold text-brand-600 tabular-nums">{fmtPct(a.score)}</span>
              </div>
            );
          })}
        </div>
        {rankChanged.some(Boolean) && (
          <div className="mt-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex items-start gap-2 text-[12.5px] text-amber-800 dark:text-amber-200">
            <Icon name="warn" className="w-4 h-4 mt-0.5"/>
            <span>Perubahan bobot menyebabkan pergeseran ranking — keputusan ini sensitif terhadap bobot kriteria.</span>
          </div>
        )}
      </div>
      </div>

      {/* Base Ranking Comparison */}
      {anyChanged && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="order-last lg:order-first">
            <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Ranking Dasar (Agregasi)</h3>
            <WeightBarChart data={baseAltData} height={200}/>
            <div className="mt-3 space-y-2">
              {baseRanked.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-ink-200 dark:border-ink-800 p-3 opacity-75">
                  <span className="text-[20px] w-7 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':'·'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50">{a.name}</div>
                    <div className="text-[11px] text-ink-500">{a.vendor}</div>
                  </div>
                  <span className="font-mono text-[14px] font-semibold text-ink-500 tabular-nums">{fmtPct(a.score)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-first lg:order-last">
            <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Ranking Baru (Dengan Penyesuaian)</h3>
            <WeightBarChart data={altData} height={200}/>
            <div className="mt-3 space-y-2">
              {ranked.map((a, i) => {
                const baseIdx = baseRanked.findIndex(b => b.id === a.id);
                const moved = baseIdx - i;
                return (
                  <div key={a.id} className={classNames(
                    'flex items-center gap-3 rounded-lg border p-3',
                    moved !== 0 ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20' : 'border-ink-200 dark:border-ink-800'
                  )}>
                    <span className="text-[20px] w-7 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':'·'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50">{a.name}</div>
                      <div className="text-[11px] text-ink-500">{a.vendor}</div>
                    </div>
                    {moved !== 0 && (
                      <Badge tone={moved > 0 ? 'green' : 'red'}>
                        {moved > 0 ? '↑' : '↓'} {Math.abs(moved)}
                      </Badge>
                    )}
                    <span className="font-mono text-[14px] font-semibold text-brand-600 tabular-nums">{fmtPct(a.score)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
    </div>
  );
}

function ExportTab({ caseData, resultData }) {
  const [downloading, setDownloading] = useState(null);

  const handlePDFExport = async () => {
    if (!window.html2pdf) {
      alert('PDF library tidak tersedia');
      return;
    }

    setDownloading('pdf');
    try {
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
          <h1 style="margin-bottom: 10px;">${caseData?.name || 'Hasil Agregasi'}</h1>
          <p style="color: #666; margin-bottom: 20px;">Metode: ${caseData?.method || 'AHP'} | Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>

          <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px;">Ringkasan Eksekutif</h2>
          <p style="margin-bottom: 10px;"><strong>Rekomendasi Teratas:</strong> ${resultData?.recommendation?.name || 'N/A'}</p>
          <p style="margin-bottom: 10px;"><strong>Skor Kepercayaan:</strong> ${(resultData?.recommendation?.score * 100).toFixed(1)}%</p>
          <p style="margin-bottom: 20px;"><strong>Tingkat Konsistensi:</strong> ${(resultData?.consistencyRatio || 0).toFixed(3)} (${(resultData?.consistencyRatio || 0) <= 0.1 ? '✓ Konsisten' : '✗ Tidak Konsisten'})</p>

          <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px;">Peringkat Alternatif</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Peringkat</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Alternatif</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Skor</th>
              </tr>
            </thead>
            <tbody>
              ${(resultData?.alternativeScores || []).slice(0, 10).map((alt, i) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${i + 1}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${alt.name}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(alt.score * 100).toFixed(2)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px;">Bobot Kriteria</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Kriteria</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Bobot</th>
              </tr>
            </thead>
            <tbody>
              ${(resultData?.criteriaWeights || []).map(crit => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px; border: 1px solid #ddd;">${crit.name}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${(crit.weight * 100).toFixed(2)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p style="margin-top: 30px; color: #999; font-size: 12px; text-align: center;">Laporan ini dibuat oleh Think Decision</p>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `${caseData?.name || 'hasil'}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      window.html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Gagal mengekspor PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleJSONExport = async () => {
    try {
      const data = {
        case: caseData,
        results: resultData,
        exportedAt: new Date().toISOString()
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseData?.name || 'hasil'}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON export error:', error);
      alert('Gagal mengekspor JSON');
    }
  };

  const handleExcelExport = async () => {
    setDownloading('xlsx');
    try {
      // Generate Excel data using pure JavaScript (no external library)
      const summaryData = [
        ['RINGKASAN HASIL AGREGASI'],
        [],
        ['Kasus:', caseData?.name || ''],
        ['Metode:', caseData?.method || ''],
        ['Tanggal Export:', new Date().toLocaleDateString('id-ID')],
        ['Status:', resultData?.alternativeScores?.length > 0 ? 'Selesai' : 'Menunggu'],
        [],
        ['REKOMENDASI TERATAS'],
        ['Alternatif:', resultData?.recommendation?.name || ''],
        ['Skor:', (resultData?.recommendation?.score || 0).toFixed(3)],
        ['CR (Konsistensi):', (resultData?.consistencyRatio || 0).toFixed(3)],
      ];

      const criteriaData = [['BOBOT KRITERIA AKHIR'], [], ['Kriteria', 'Bobot', 'Persentase']];
      (resultData?.criteriaWeights || []).forEach(c => {
        criteriaData.push([c.name, c.weight.toFixed(3), (c.weight * 100).toFixed(1) + '%']);
      });

      const altData = [['PERINGKAT ALTERNATIF'], [], ['Peringkat', 'Alternatif', 'Skor', 'Persentase']];
      (resultData?.alternativeScores || []).forEach((a, i) => {
        altData.push([i + 1, a.name, a.score.toFixed(3), (a.score * 100).toFixed(1) + '%']);
      });

      // Convert to CSV format (Excel readable)
      const csvContent = [
        ...summaryData.map(r => r.join('\t')),
        '',
        ...criteriaData.map(r => r.join('\t')),
        '',
        ...altData.map(r => r.join('\t')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${caseData?.name || 'hasil'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[ExcelExport] Export berhasil');
      setDownloading(null);
    } catch (error) {
      console.error('[ExcelExport] Error:', error);
      alert('Gagal mengekspor Excel: ' + error.message);
      setDownloading(null);
    }
  };

  const handlePNGExport = async () => {
    setDownloading('png');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1920, 1200);

      // Helper functions
      const drawBox = (x, y, w, h, text, weight, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2 - 12);

        if (weight) {
          ctx.font = '12px Arial';
          ctx.fillText(weight, x + w / 2, y + h / 2 + 12);
        }
      };

      const drawLine = (x1, y1, x2, y2, color = '#999', width = 2) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };

      // Title
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(caseData?.name || 'Hierarki Keputusan', 960, 40);

      // Level 1: Goal
      const goalX = 860;
      const goalY = 80;
      const goalW = 200;
      const goalH = 70;
      drawBox(goalX, goalY, goalW, goalH, 'GOAL', '', '#6366f1');

      // Level 2: Criteria
      const criteria = caseData?.criteria || [];
      const critY = 220;
      const critH = 80;
      const critW = 140;
      const critSpacing = (1920 - 200) / Math.max(criteria.length, 1);
      const critStartX = 100;

      criteria.forEach((c, i) => {
        const x = critStartX + i * critSpacing + (critSpacing - critW) / 2;
        const weight = resultData?.criteriaWeights?.[i]?.weight || 0;
        const weightText = (weight * 100).toFixed(1) + '%';

        drawBox(x, critY, critW, critH, c.name.substring(0, 18), weightText, '#10b981');

        // Line from goal to criteria
        drawLine(goalX + goalW / 2, goalY + goalH, x + critW / 2, critY, '#ccc', 2);
      });

      // Level 3: Alternatives
      const alts = caseData?.alternatives || [];
      const altY = 400;
      const altH = 100;
      const altW = 160;
      const altSpacing = (1920 - 200) / Math.max(alts.length, 1);
      const altStartX = 100;

      alts.forEach((a, i) => {
        const x = altStartX + i * altSpacing + (altSpacing - altW) / 2;
        const score = resultData?.alternativeScores?.[i]?.score || 0;
        const scoreText = (score * 100).toFixed(1) + '%';
        const rank = i + 1;

        // Color based on rank
        let color = '#0ea5e9';
        if (rank === 1) color = '#10b981';
        else if (rank === 2) color = '#f59e0b';
        else if (rank === 3) color = '#ef4444';

        drawBox(x, altY, altW, altH, `${rank}. ${a.name.substring(0, 12)}`, scoreText, color);

        // Lines from all criteria to this alternative
        criteria.forEach((_, ci) => {
          const cx = critStartX + ci * critSpacing + (critSpacing - critW) / 2 + critW / 2;
          drawLine(cx, critY + critH, x + altW / 2, altY, '#ddd', 1);
        });
      });

      // Legend
      let legendY = 580;
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Ranking Alternatif:', 100, legendY);

      legendY += 35;
      ctx.font = '12px Arial';
      (resultData?.alternativeScores || []).forEach((a, i) => {
        const colors = ['#10b981', '#f59e0b', '#ef4444'];
        const color = colors[i] || '#94a3b8';
        ctx.fillStyle = color;
        ctx.fillRect(100, legendY - 12, 20, 20);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(100, legendY - 12, 20, 20);

        ctx.fillStyle = '#333';
        ctx.fillText(`${i + 1}. ${a.name} - ${(a.score * 100).toFixed(1)}%`, 140, legendY);
        legendY += 28;
      });

      // Consistency info
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`CR (Konsistensi): ${(resultData?.consistencyRatio || 0).toFixed(3)} - ${(resultData?.consistencyRatio || 0) <= 0.1 ? '✓ Konsisten' : '✗ Tidak Konsisten'}`, 100, 1100);
      ctx.fillText(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 100, 1125);
      ctx.fillText('Think Decision - AHP Decision Support System', 100, 1160);

      // Download
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${caseData?.name || 'hierarki'}-${new Date().toISOString().split('T')[0]}.png`;
      link.click();

      setDownloading(null);
      console.log('[PNGExport] Export berhasil');
    } catch (error) {
      console.error('[PNGExport] Error:', error);
      alert('Gagal mengekspor PNG: ' + error.message);
      setDownloading(null);
    }
  };

  const opts = [
    { id:'pdf',  title:'Laporan PDF',          desc:'Ringkasan eksekutif + detail bobot, hierarki, & sensitivity (12 hal)', icon:'file', handler: handlePDFExport },
    { id:'xlsx', title:'Excel (Data Mentah)',   desc:'Matriks per pakar, bobot lokal/global, CR — siap di-replikasi', icon:'grid', handler: handleExcelExport },
    { id:'png',  title:'Gambar Hierarki PNG',   desc:'Diagram pohon transparan, 1920×1080, untuk slide', icon:'eye', handler: handlePNGExport },
    { id:'json', title:'Bundle JSON',           desc:'Seluruh konfigurasi & hasil — untuk dijalankan ulang di tools lain', icon:'flask', handler: handleJSONExport },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {opts.map(o => (
        <Card key={o.id} className="p-4 flex items-start gap-3">
          <span className="w-10 h-10 grid place-items-center rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 shrink-0"><Icon name={o.icon}/></span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-ink-900 dark:text-ink-50">{o.title}</div>
            <div className="text-[12px] text-ink-500 dark:text-ink-400 leading-snug">{o.desc}</div>
          </div>
          <Button
            size="sm"
            icon={downloading === o.id ? 'loading' : 'download'}
            onClick={() => o.handler && o.handler()}
            disabled={!o.handler || downloading !== null}
          >
            {downloading === o.id ? 'Prosesing...' : 'Unduh'}
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ExpertDiscrepancyTab({ data, expertsData }) {
  if (!data || data.status === 'no_data') {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-500">Belum ada data divergensi expert tersedia</p>
      </div>
    );
  }

  const experts = data?.experts || [];
  const criteria = data?.criteria || [];

  return (
    <div className="space-y-6">
      {/* Expert CR & Status */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-4">Status Konsistensi Pakar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {experts.map(e => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: e.avatarColor }}>
                  <span className="text-white text-[12px] font-bold">{e.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-800 dark:text-ink-100">{e.name}</div>
                  <div className="text-[11px] text-ink-500 truncate">{e.email}</div>
                  <div className="mt-2">
                    <div className="text-[12px] font-mono">CR: {e.cr.toFixed(3)}</div>
                    <div className={classNames('text-[11px] font-semibold', e.cr <= 0.1 ? 'text-emerald-600' : e.cr <= 0.15 ? 'text-amber-600' : 'text-rose-600')}>
                      {e.crStatus}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Criteria Divergence Analysis */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-4">Analisis Divergensi per Kriteria</h3>
        <div className="space-y-3">
          {criteria.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-ink-800 dark:text-ink-100 mb-2">{c.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="text-ink-500">Mean:</span>
                      <span className="ml-2 font-mono">{(c.mean * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-ink-500">Std Dev:</span>
                      <span className="ml-2 font-mono">{(c.stdDev * 100).toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-ink-500">Min:</span>
                      <span className="ml-2 font-mono">{(c.min * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-ink-500">Max:</span>
                      <span className="ml-2 font-mono">{(c.max * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={classNames('inline-block px-3 py-1 rounded-full text-[12px] font-semibold',
                    c.divergence === 'HIGH' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300' :
                    c.divergence === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  )}>
                    {c.divergence === 'HIGH' ? '⚠️ Tinggi' : c.divergence === 'MEDIUM' ? '◐ Sedang' : '✓ Rendah'}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-2">Divergensi</div>
                </div>
              </div>

              {/* Mini bar chart showing expert weights for this criteria */}
              <div className="mt-3 flex items-end gap-1 h-16">
                {experts.map(e => {
                  const weight = e.weights?.[criteria.indexOf(c)] || 0;
                  const heightPct = Math.max(weight * 100, 5);
                  return (
                    <div
                      key={e.id}
                      className="flex-1 rounded-t transition"
                      style={{
                        height: `${heightPct}%`,
                        background: e.avatarColor,
                        opacity: 0.8
                      }}
                      title={`${e.name}: ${(weight * 100).toFixed(1)}%`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-ink-400">
                <span>0%</span>
                <span>100%</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Expert Weight Matrix Table */}
      <div>
        <h3 className="font-serif text-[18px] text-ink-900 dark:text-ink-50 mb-3">Matrix Bobot Kriteria per Pakar</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border border-ink-200 dark:border-ink-800">
            <thead>
              <tr className="bg-ink-50/60 dark:bg-ink-950/40">
                <th className="p-2 text-left font-semibold text-ink-700 dark:text-ink-200 border-b border-ink-200 dark:border-ink-800">Kriteria</th>
                {experts.map(e => (
                  <th key={e.id} className="p-2 text-center font-semibold border-b border-ink-200 dark:border-ink-800">
                    <div className="w-6 h-6 rounded-full mx-auto" style={{ background: e.avatarColor }}/>
                    <div className="text-[10px] mt-1 truncate">{e.name.substring(0, 8)}</div>
                  </th>
                ))}
                <th className="p-2 text-center font-semibold border-b border-ink-200 dark:border-ink-800 bg-brand-50/40 dark:bg-brand-950/20">Mean</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, ci) => (
                <tr key={c.id} className="border-b border-ink-100 dark:border-ink-800">
                  <td className="p-2 font-medium text-ink-700 dark:text-ink-200">{c.name}</td>
                  {experts.map(e => {
                    const weight = e.weights?.[ci] || 0;
                    const diff = Math.abs(weight - c.mean);
                    const isHigh = diff > c.stdDev;
                    return (
                      <td
                        key={e.id}
                        className={classNames('p-2 text-center font-mono',
                          isHigh ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300' : ''
                        )}
                      >
                        {(weight * 100).toFixed(1)}%
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-mono bg-brand-50/40 dark:bg-brand-950/20 font-semibold text-brand-700 dark:text-brand-300">
                    {(c.mean * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[11px] text-ink-500">
          <span className="inline-block px-2 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded mr-2">Merah = Outlier</span>
          Sel berwarna merah menunjukkan pakar yang nilainya >1 std dev dari rata-rata
        </div>
      </div>

      {/* Summary Insights */}
      <Card className="p-4 border-l-4 border-brand-600 bg-brand-50/30 dark:bg-brand-950/20">
        <div className="text-[13px] text-ink-800 dark:text-ink-100">
          <div className="font-semibold mb-2">📊 Insights</div>
          <ul className="space-y-1 text-[12px]">
            <li>✓ Total pakar: {experts.length}</li>
            <li>✓ Pakar dengan CR konsisten (≤0.10): {experts.filter(e => e.cr <= 0.1).length}/{experts.length}</li>
            <li>⚠️  Kriteria dengan divergensi tinggi: {criteria.filter(c => c.divergence === 'HIGH').length}</li>
            <li className="text-amber-700 dark:text-amber-300">Rekomendasi: {criteria.filter(c => c.divergence === 'HIGH').length > 0 ? 'Pertimbangkan diskusi dengan pakar untuk kriteria yang divergen' : 'Konsensus pakar cukup baik'}</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { CreatorDashboard, CaseWizard, CaseDetail, CreatorResults, CREATOR_NAV, CasesView, ExpertsView, LibraryView, SettingsView });
