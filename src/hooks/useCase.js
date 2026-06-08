import { useState, useEffect, useCallback } from 'react';
import { casesService } from '../api/cases';

export function useCase(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCase = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const response = await casesService.getCaseById(caseId);
      const data = response.data || null;
      setCaseData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
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
