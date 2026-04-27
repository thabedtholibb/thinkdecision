import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { criteriaApi } from '@/lib/api';
import { Criteria } from '@/types';

export function useCriteria(caseId: string) {
  return useQuery<Criteria[]>({
    queryKey: ['criteria', caseId],
    queryFn: () => criteriaApi.list(caseId) as Promise<Criteria[]>,
    enabled: !!caseId,
  });
}

export function useCreateCriteria(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => criteriaApi.create(caseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['criteria', caseId] }),
  });
}

export function useDeleteCriteria(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => criteriaApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['criteria', caseId] }),
  });
}
