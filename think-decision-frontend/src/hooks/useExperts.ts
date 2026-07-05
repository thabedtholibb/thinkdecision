import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { CaseExpert, Expert } from "../types";

// Daftar pakar sebuah kasus — diambil dari case_experts yang tersemat di GET /cases/:id
export function useExperts(caseId: string | undefined) {
  return useQuery<Expert[]>({
    queryKey: ["experts", caseId],
    queryFn: async () => {
      const rows = ((await api.get(`/cases/${caseId}`)).data.data?.experts ?? []) as CaseExpert[];
      return rows.map((row) => ({
        id: row.expert_id,
        email: row.users?.email ?? "",
        name: row.users?.name,
        institution: row.users?.institution,
        weight: row.weight ?? 1,
        status: row.status,
        invited_at: row.created_at,
        completed_at: row.completed_at,
      }));
    },
    enabled: !!caseId,
  });
}

// POST /experts — buat akun pakar (idempoten). Mengembalikan tempPassword bila akun baru.
export function useCreateExpert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; name?: string; institution?: string }) =>
      api.post("/experts", data).then(
        (r) => r.data.data as { id: string; email: string; name?: string; tempPassword?: string }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["experts"] }),
  });
}

// GET /experts — semua pakar terdaftar (untuk memilih saat membuat kasus)
export function useAllExperts() {
  return useQuery<Expert[]>({
    queryKey: ["experts", "all"],
    queryFn: async () => (await api.get("/experts")).data.data ?? [],
  });
}
