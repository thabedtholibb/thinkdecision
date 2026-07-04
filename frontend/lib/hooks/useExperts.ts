'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';

const EXPERTS_QUERY_KEY = 'experts';

export function useExperts(caseId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [EXPERTS_QUERY_KEY, caseId],
    queryFn: () => api.getExperts(caseId, token!),
    enabled: !!token && !!caseId,
  });
}

export function useInviteExpert(caseId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => api.inviteExpert(caseId, email, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPERTS_QUERY_KEY, caseId] });
    },
  });
}
