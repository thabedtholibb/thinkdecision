import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ComparisonMap, ExpertDashboard } from "../types";

// PUT /judgments/:levelId — simpan draft matriks satu level.
// levelId kriteria harus berawalan "crit", level alternatif berawalan "alt-".
export function useSaveJudgment() {
  return useMutation({
    mutationFn: (data: { levelId: string; caseId: string; comparisons: ComparisonMap }) =>
      api
        .put(`/judgments/${data.levelId}`, {
          caseId: data.caseId,
          comparisons: data.comparisons,
        })
        .then((r) => r.data.data as { levelId: string; cr: number; weights: number[] }),
  });
}

// POST /judgments/:expertId/submit — finalisasi seluruh penilaian pakar untuk satu kasus
export function useSubmitJudgments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { expertId: string; caseId: string }) =>
      api.post(`/judgments/${data.expertId}/submit`, { caseId: data.caseId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-dashboard"] });
      qc.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

// GET /experts/dashboard — daftar undangan & statistik pakar yang sedang login
export function useExpertDashboard(enabled = true) {
  return useQuery<ExpertDashboard>({
    queryKey: ["expert-dashboard"],
    queryFn: async () => (await api.get("/experts/dashboard")).data.data,
    enabled,
  });
}
