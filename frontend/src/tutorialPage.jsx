/* Full-page Tutorial Guide with Sidebar Navigation */

function TutorialPage({ go, theme, onToggleTheme, onSwitchRole, user, role = 'expert' }) {
  const [activeMethod, setActiveMethod] = React.useState('AHP');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const methods = ['AHP', 'Fuzzy AHP', 'ANP', 'Fuzzy ANP'];

  const navItems = role === 'creator'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'cases', label: 'Kasus Saya', icon: 'layers' },
        { id: 'experts', label: 'Pakar', icon: 'users' },
        { id: 'library', label: 'Pustaka', icon: 'book' },
        { id: 'settings', label: 'Pengaturan', icon: 'settings' },
        { id: 'tutorial', label: 'Panduan', icon: 'info' },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: 'home' },
        { id: 'tutorial', label: 'Panduan', icon: 'info' },
      ];

  const handleNav = (id) => {
    if (id === 'tutorial') return; // Already on tutorial page
    const screenMap = {
      dashboard: role === 'creator' ? 'creator-dashboard' : 'expert-dashboard',
      cases: role === 'creator' ? 'creator-dashboard' : 'expert-dashboard',
      history: 'expert-dashboard',
      profile: 'expert-dashboard',
      experts: 'creator-dashboard',
      library: 'creator-dashboard',
      settings: 'creator-dashboard',
    };
    if (screenMap[id]) {
      go({ screen: screenMap[id] });
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Sidebar Navigation */}
      <Sidebar
        items={navItems}
        active="tutorial"
        onChange={handleNav}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        footer={
          <div className="p-3 border-t border-ink-200 dark:border-ink-800 flex items-center gap-2">
            <Avatar name={user?.name || 'User'} color={role === 'creator' ? '#6366f1' : '#10b981'}/>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold truncate text-ink-800 dark:text-ink-100">{user?.name}</div>
              <div className="text-[11px]" style={{color: role === 'creator' ? '#6366f1' : '#10b981'}}>
                {role === 'creator' ? 'Pembuat' : 'Pakar'}
              </div>
            </div>
            <button onClick={() => go({ screen: 'landing' })} className="w-8 h-8 grid place-items-center rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-500" title="Keluar">
              <Icon name="logout" className="w-4 h-4"/>
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 px-6 py-4 shadow-sm">
          <div className="mb-4">
            <h1 className="font-serif text-2xl font-medium text-ink-900 dark:text-ink-50">Panduan Penggunaan</h1>
            <p className="text-sm text-ink-500 mt-1">Pelajari cara menggunakan setiap metode</p>
          </div>

          {/* Method Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {methods.map(method => (
              <button
                key={method}
                onClick={() => setActiveMethod(method)}
                className={classNames(
                  'px-3 py-1.5 rounded-lg font-medium text-[12px] transition whitespace-nowrap',
                  activeMethod === method
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {role === 'expert' ? (
              <ExpertTutorials method={activeMethod} />
            ) : (
              <CreatorTutorials method={activeMethod} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export
window.TutorialPage = TutorialPage;
