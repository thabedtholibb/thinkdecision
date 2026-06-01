/* App shell — screen state, theme, toast, mounts everything */
/* Now using AppContext for global state management */

function AppContent() {
  const [route, setRoute] = useState({ screen: 'landing', role: null, caseId: null });
  const [toast, setToast] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use context for auth and theme
  const { user, isAuthenticated, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Define go first with smooth transition
  const go = useCallback((next) => {
    // If navigating to different screen, trigger fade out
    if (next.screen && next.screen !== route.screen) {
      setIsTransitioning(true);
      // Wait for fade out animation, then change route
      setTimeout(() => {
        setRoute(prev => ({ ...prev, ...next }));
        setIsTransitioning(false);
      }, 120);
    } else {
      setRoute(prev => ({ ...prev, ...next }));
    }

    if (next.toast) {
      const toastObj = typeof next.toast === 'string'
        ? { message: next.toast, type: 'success' }
        : next.toast;
      setToast(toastObj);
      setTimeout(() => setToast(null), 3500);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.screen]);

  // restore last screen from localStorage so refresh during iteration doesn't lose place
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('decideai:route') || 'null');
      if (saved && saved.screen) setRoute(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('decideai:route', JSON.stringify(route)); } catch {}
  }, [route]);

  useEffect(() => {
    const handleTokenExpired = () => {
      logout();
      const isExpert = role === 'expert';
      go({
        screen: isExpert ? 'login-expert' : 'login-creator',
        role: null
      });
    };

    window.addEventListener('auth:expired', handleTokenExpired);
    return () => window.removeEventListener('auth:expired', handleTokenExpired);
  }, [role, logout, go]);

  const onToggleTheme = toggleTheme;
  const onSwitchRole = () => {
    if (role === 'creator') {
      go({ screen: 'login-expert', role: null });
    } else {
      go({ screen: 'login-creator', role: null });
    }
  };

  const theme = isDark ? 'dark' : 'light';
  const props = { go, theme, onToggleTheme, onSwitchRole, user, caseId: route.caseId };

  let view = null;
  switch (route.screen) {
    case 'landing':            view = <ErrorBoundary><Landing {...props}/></ErrorBoundary>; break;
    case 'login-creator':      view = <ErrorBoundary><LoginCreator {...props}/></ErrorBoundary>; break;
    case 'login-expert':       view = <ErrorBoundary><LoginExpert {...props}/></ErrorBoundary>; break;
    case 'register':           view = <ErrorBoundary><RegisterCreator {...props}/></ErrorBoundary>; break;
    case 'creator-dashboard':  view = <ErrorBoundary><CreatorDashboard {...props}/></ErrorBoundary>; break;
    case 'creator-tutorial':   view = <ErrorBoundary><TutorialPage {...props} role="creator"/></ErrorBoundary>; break;
    case 'wizard':             view = <ErrorBoundary><CaseWizard {...props}/></ErrorBoundary>; break;
    case 'caseDetail':         view = <ErrorBoundary><CaseDetail {...props}/></ErrorBoundary>; break;
    case 'results':            view = <ErrorBoundary><CreatorResults {...props}/></ErrorBoundary>; break;
    case 'expert-dashboard':   view = <ErrorBoundary><ExpertDashboard {...props}/></ErrorBoundary>; break;
    case 'expert-tutorial':    view = <ErrorBoundary><TutorialPage {...props} role="expert"/></ErrorBoundary>; break;
    case 'expert-fill':        view = <ErrorBoundary><ExpertFill {...props}/></ErrorBoundary>; break;
    default:                   view = <ErrorBoundary><Landing {...props}/></ErrorBoundary>;
  }

  return (
    <>
      <div className={classNames(
        'transition-opacity duration-150',
        isTransitioning ? 'opacity-0' : 'opacity-100 anim-fade'
      )}>
        {view}
      </div>
      {toast && (
        <div className={classNames(
          'fixed left-1/2 z-[100] pointer-events-none anim-fade',
          toast.type === 'error' ? 'bottom-6' : 'top-1/2 -translate-y-1/2'
        )}>
          <div className={classNames(
            'px-6 py-4 rounded-xl text-white text-[14px] font-medium shadow-xl flex items-center gap-3 pointer-events-auto -translate-x-1/2 backdrop-blur-sm border',
            toast.type === 'error'
              ? 'bg-rose-600/90 shadow-rose-900/40 border-rose-500/50'
              : 'bg-emerald-600/90 shadow-emerald-900/40 border-emerald-500/50'
          )}>
            <div className={classNames(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              toast.type === 'error'
                ? 'bg-rose-500/30'
                : 'bg-emerald-500/30'
            )}>
              <Icon name={toast.type === 'error' ? 'x' : 'check'} className="w-4 h-4"/>
            </div>
            <div>
              <p className="font-semibold">{typeof toast === 'string' ? toast : toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Root App with AppProvider wrapper
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
