'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';

const COMPARISONS_QUERY_KEY = 'comparisons';

export function useComparison(caseId: string, nodeId: string, expertId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [COMPARISONS_QUERY_KEY, caseId, nodeId, expertId],
    queryFn: () => api.getComparison(caseId, nodeId, expertId, token!),
    enabled: !!token && !!caseId && !!nodeId && !!expertId,
  });
}

export function useSubmitComparison(caseId: string, nodeId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.submitComparison(caseId, nodeId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPARISONS_QUERY_KEY, caseId, nodeId] });
    },
  });
}

export function useResults(caseId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['results', caseId],
    queryFn: () => api.getResults(caseId, token!),
    enabled: !!token && !!caseId,
  });
}

export function useAggregateResults(caseId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (method: string) => api.aggregateResults(caseId, method, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', caseId] });
    },
  });
}
