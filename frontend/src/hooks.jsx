/* Custom hooks for API data fetching */
const { useState, useEffect, useCallback, useRef } = React;

// useCase: Fetch single case by ID
function useCase(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCase = useCallback(async (signal) => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await window.casesService.getCaseById(caseId, { signal });
      setCaseData(data);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return; // superseded by a newer request
      setError(err.message || 'Failed to load case');
      setCaseData(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    // Cancel the in-flight request if caseId changes (or we unmount) before
    // it resolves, so a slow, stale response can't overwrite newer state.
    const controller = new AbortController();
    fetchCase(controller.signal);
    return () => controller.abort();
  }, [fetchCase]);

  return { caseData, loading, error, refetch: fetchCase };
}

// useCases: Fetch all cases with optional filters
function useCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchCases = useCallback(async (signal) => {
    try {
      setLoading(true);
      const data = await window.casesService.getCases(filters, { signal });
      setCases(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load cases');
      setCases([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Cancel the in-flight request if filters change (or we unmount) before
    // it resolves, so a slow, stale response can't overwrite newer state.
    const controller = new AbortController();
    fetchCases(controller.signal);
    return () => controller.abort();
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

  // Tracks the in-flight request's controller so a slow poll tick can't
  // resolve after a newer one and stomp fresher state.
  const abortRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const data = await window.notificationsService.getNotifications(1, 50, { signal: controller.signal });
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(data.filter(n => !n.read).length || 0);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    let interval;
    if (pollInterval > 0) {
      interval = setInterval(fetchNotifications, pollInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
      abortRef.current?.abort();
    };
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
