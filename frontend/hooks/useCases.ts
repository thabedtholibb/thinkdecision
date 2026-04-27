import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '@/lib/api';
import { Case } from '@/types';

export function useCases(status?: string) {
  return useQuery<Case[]>({
    queryKey: ['cases', status],
    queryFn: () => casesApi.list(status) as Promise<Case[]>,
  });
}

export function useCase(id: string) {
  return useQuery<Case>({
    queryKey: ['cases', id],
    queryFn: () => casesApi.get(id) as Promise<Case>,
    enabled: !!id,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => casesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => casesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases', id] }),
  });
}

export function useUpdateCaseStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => casesApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => casesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  });
}
