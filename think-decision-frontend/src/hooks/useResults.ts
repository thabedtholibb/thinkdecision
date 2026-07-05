import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ResultsResponse } from "../types";

// GET /results/:caseId — agregasi dihitung backend saat diminta.
// status: "waiting" (belum ada judgment) | "completed" (hasil tersedia)
export function useResults(caseId: string | undefined) {
  return useQuery<ResultsResponse>({
    queryKey: ["results", caseId],
    queryFn: async () => (await api.get(`/results/${caseId}`)).data as ResultsResponse,
    enabled: !!caseId,
  });
}
