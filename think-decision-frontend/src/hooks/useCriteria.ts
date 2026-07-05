import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Criterion, Alternative } from "../types";

// Backend Node menyematkan criteria & alternatives dalam GET /cases/:id —
// hooks ini mengambil dari sana (tidak ada endpoint CRUD terpisah).
export function useCriteria(caseId: string | undefined) {
  return useQuery<Criterion[]>({
    queryKey: ["criteria", caseId],
    queryFn: async () =>
      ((await api.get(`/cases/${caseId}`)).data.data?.criteria ?? []) as Criterion[],
    enabled: !!caseId,
  });
}

export function useAlternatives(caseId: string | undefined) {
  return useQuery<Alternative[]>({
    queryKey: ["alternatives", caseId],
    queryFn: async () =>
      ((await api.get(`/cases/${caseId}`)).data.data?.alternatives ?? []) as Alternative[],
    enabled: !!caseId,
  });
}
