/* Custom hooks for API data fetching */
const { useState, useEffect, useCallback } = React;

// useCase: Fetch single case by ID
function useCase(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCase = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await window.casesService.getCaseById(caseId);
      setCaseData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load case');
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  return { caseData, loading, error, refetch: fetchCase };
}

// useCases: Fetch all cases with optional filters
function useCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.casesService.getCases(filters);
      setCases(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const deleteCase = async (caseId) => {
    try {
      await window.casesService.deleteCase(caseId);
      setCases(cases.filter(c => c.id !== caseId));
    } catch (err) {
      console.error('Failed to delete case:', err);
    }
  };

  return {
    cases,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchCases,
    deleteCase,
  };
}

// useNotifications: Fetch notifications with polling support
function useNotifications(pollInterval = 30000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.notificationsService.getNotifications(1, 50);
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(data.filter(n => !n.read).length || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (pollInterval > 0) {
      const interval = setInterval(fetchNotifications, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, pollInterval]);

  const markAsRead = async (notificationId) => {
    try {
      await window.notificationsService.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n => window.notificationsService.markAsRead(n.id))
      );
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

Object.assign(window, { useCase, useCases, useNotifications });
