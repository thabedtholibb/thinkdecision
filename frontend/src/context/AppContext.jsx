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

  const login = useCallback((userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('decideai:user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('decideai:token', token);
      window.apiClient?.setToken(token);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('decideai:user');
    localStorage.removeItem('decideai:token');
    window.apiClient?.setToken(null);
  }, []);

  const refreshUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('decideai:user', JSON.stringify(userData));
  }, []);

  // Restore auth from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('decideai:user');
    const savedToken = localStorage.getItem('decideai:token');
    // Guard: sesi lama yang rusak bisa menyimpan string "undefined"
    const tokenValid = savedToken && savedToken !== 'undefined' && savedToken !== 'null';
    if (savedUser && tokenValid) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAuthenticated(true);
        // Pasang kembali token ke API client agar request pasca-reload terautentikasi
        window.apiClient?.setToken(savedToken);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('decideai:user');
        localStorage.removeItem('decideai:token');
      }
    } else if (savedUser || savedToken) {
      // Bersihkan sisa sesi rusak
      localStorage.removeItem('decideai:user');
      localStorage.removeItem('decideai:token');
    }
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
