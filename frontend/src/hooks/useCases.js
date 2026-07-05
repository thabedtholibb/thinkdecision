import { useState, useEffect, useCallback } from 'react';
import { casesService } from '../api/cases';

export function useCases(initialFilters = {}) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await casesService.getCases(filters);
      const data = response.data || [];
      setCases(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const deleteCase = useCallback(async (caseId) => {
    try {
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

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
