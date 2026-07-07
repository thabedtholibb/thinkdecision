/* Global App State Management - Context + Provider */
const { useState, useCallback, useEffect, createContext, useContext } = React;

// Create AppContext
const AppContext = createContext(null);

// AppProvider Component
function AppProvider({ children }) {
  // ============================================================
  // AUTH STATE
  // ============================================================
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // The access token lives only in the httpOnly cookie the backend sets on
  // login — it is never stored here or in localStorage, so it stays out of
  // reach of JavaScript (and therefore of XSS) entirely. `login()` only
  // needs the user profile to display; every API request already carries
  // the cookie automatically via `credentials: 'include'`.
  const login = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('decideai:user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('decideai:user');
  }, []);

  const refreshUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('decideai:user', JSON.stringify(userData));
  }, []);

  // On mount, don't trust a locally cached "logged in" flag — the only
  // reliable signal is the server, since the session cookie is httpOnly and
  // may have expired or been revoked since the last visit. `getMe()` rides
  // on that cookie automatically; a cached user is used only as an instant
  // first paint while that check is in flight.
  useEffect(() => {
    const savedUser = localStorage.getItem('decideai:user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('decideai:user');
      }
    }

    (async () => {
      try {
        const response = await window.authService.getMe();
        if (response?.data) {
          setUser(response.data);
          setIsAuthenticated(true);
          localStorage.setItem('decideai:user', JSON.stringify(response.data));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('decideai:user');
        }
      } catch (e) {
        // Not logged in, or session expired — fall back to logged-out state
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('decideai:user');
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  const role = user?.role || null;

  // ============================================================
  // THEME STATE
  // ============================================================
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('decideai:theme');
    if (!saved) return false;
    try {
      return JSON.parse(saved);
    } catch (e) {
      // Handle old format (stored as 'light' or 'dark' string)
      return saved === 'dark';
    }
  });

  useEffect(() => {
    localStorage.setItem('decideai:theme', JSON.stringify(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const setTheme = useCallback((value) => {
    setIsDark(value);
  }, []);

  // ============================================================
  // NOTIFICATIONS STATE
  // ============================================================
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10

    // Auto-remove notification after 5 seconds if no action
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ============================================================
  // UI STATE (Loading, Errors)
  // ============================================================
  const [isLoading, setLoading] = useState(false);
  const [globalError, setError] = useState(null);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const value = {
    // Auth
    auth: {
      user,
      isAuthenticated,
      authChecked,
      role,
      login,
      logout,
      refreshUser
    },
    // Theme
    theme: {
      isDark,
      toggleTheme,
      setTheme
    },
    // Notifications
    notifications: {
      list: notifications,
      addNotification,
      removeNotification,
      clearAll
    },
    // UI
    ui: {
      isLoading,
      globalError,
      setLoading,
      setError
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================
// CUSTOM HOOKS FOR CONTEXT ACCESS
// ============================================================

function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

function useAuth() {
  const { auth } = useAppContext();
  return auth;
}

function useTheme() {
  const { theme } = useAppContext();
  return theme;
}

function useNotifications() {
  const { notifications } = useAppContext();
  return notifications;
}

function useAppUI() {
  const { ui } = useAppContext();
  return ui;
}

// Export for global access if needed
if (typeof window !== 'undefined') {
  window.AppProvider = AppProvider;
  window.useAuth = useAuth;
  window.useTheme = useTheme;
  window.useNotifications = useNotifications;
  window.useAppUI = useAppUI;
  window.useAppContext = useAppContext;
}

// Export as module
Object.assign(window, {
  AppProvider,
  useAuth,
  useTheme,
  useNotifications,
  useAppUI,
  useAppContext
});
