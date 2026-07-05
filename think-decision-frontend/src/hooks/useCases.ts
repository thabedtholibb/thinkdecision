import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Case } from "../types";

// GET /cases → { success, data: Case[], pagination }
export function useCases() {
  return useQuery<Case[]>({
    queryKey: ["cases"],
    queryFn: async () => (await api.get("/cases")).data.data ?? [],
  });
}

// GET /cases/:id → { success, data: Case } (criteria/alternatives/experts tersemat)
export function useCase(id: string | undefined) {
  return useQuery<Case>({
    queryKey: ["cases", id],
    queryFn: async () => (await api.get(`/cases/${id}`)).data.data,
    enabled: !!id,
  });
}

// POST /cases — payload lengkap (criteria/alternatives/experts sekaligus)
export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/cases", data).then((r) => r.data.data as Case),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });
}

// POST /cases/:id/publish — draft → active
export function usePublishCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/cases/${id}/publish`).then((r) => r.data.data as Case),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["cases", id] });
    },
  });
}
