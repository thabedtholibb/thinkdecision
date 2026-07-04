'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { Case, CaseWithStats } from '@/types';

const CASES_QUERY_KEY = 'cases';

export function useCases() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [CASES_QUERY_KEY],
    queryFn: () => api.getCases(token!),
    enabled: !!token,
  });
}

export function useCase(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [CASES_QUERY_KEY, id],
    queryFn: () => api.getCase(id, token!),
    enabled: !!token && !!id,
  });
}

export function useCreateCase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.createCase(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_QUERY_KEY] });
    },
  });
}

export function useUpdateCase(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updateCase(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CASES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CASES_QUERY_KEY, id] });
    },
  });
}
