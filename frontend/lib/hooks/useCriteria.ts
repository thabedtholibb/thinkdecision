'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';

const CRITERIA_QUERY_KEY = 'criteria';

export function useCriteria(caseId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [CRITERIA_QUERY_KEY, caseId],
    queryFn: () => api.getCriteria(caseId, token!),
    enabled: !!token && !!caseId,
  });
}

export function useAddCriteria(caseId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.addCriteria(caseId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CRITERIA_QUERY_KEY, caseId] });
    },
  });
}

export function useDeleteCriteria(caseId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (criteriaId: string) => api.deleteCriteria(caseId, criteriaId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CRITERIA_QUERY_KEY, caseId] });
    },
  });
}
