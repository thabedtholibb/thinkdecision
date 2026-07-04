'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';

const ALTERNATIVES_QUERY_KEY = 'alternatives';

export function useAlternatives(caseId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [ALTERNATIVES_QUERY_KEY, caseId],
    queryFn: () => api.getAlternatives(caseId, token!),
    enabled: !!token && !!caseId,
  });
}

export function useAddAlternative(caseId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.addAlternative(caseId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALTERNATIVES_QUERY_KEY, caseId] });
    },
  });
}

export function useDeleteAlternative(caseId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (altId: string) => api.deleteAlternative(caseId, altId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALTERNATIVES_QUERY_KEY, caseId] });
    },
  });
}
