import axios from "axios";

// Backend Node/Express (Think Decision) — semua route di bawah /api/v1
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Helper: pesan error dari format backend { success:false, error:{ message } }
export function apiErrorMessage(err: any, fallback = "Terjadi kesalahan"): string {
  return err?.response?.data?.error?.message || err?.response?.data?.message || fallback;
}
