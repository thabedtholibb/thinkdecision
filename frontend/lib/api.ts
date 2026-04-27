const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(res.status, error.detail || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; role: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch('/auth/me'),
};

// Cases
export const casesApi = {
  list: (status?: string) => apiFetch(`/cases${status ? `?status=${status}` : ''}`),
  get: (id: string) => apiFetch(`/cases/${id}`),
  create: (data: object) => apiFetch('/cases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiFetch(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => apiFetch(`/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => apiFetch(`/cases/${id}`, { method: 'DELETE' }),
};

// Criteria
export const criteriaApi = {
  list: (caseId: string) => apiFetch(`/cases/${caseId}/criteria`),
  create: (caseId: string, data: object) => apiFetch(`/cases/${caseId}/criteria`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiFetch(`/criteria/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/criteria/${id}`, { method: 'DELETE' }),
};

// Alternatives
export const alternativesApi = {
  list: (caseId: string) => apiFetch(`/cases/${caseId}/alternatives`),
  create: (caseId: string, data: object) => apiFetch(`/cases/${caseId}/alternatives`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: object) => apiFetch(`/alternatives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/alternatives/${id}`, { method: 'DELETE' }),
};

// Experts
export const expertsApi = {
  list: (caseId: string) => apiFetch(`/cases/${caseId}/experts`),
  invite: (caseId: string, email: string) => apiFetch(`/cases/${caseId}/experts`, { method: 'POST', body: JSON.stringify({ email }) }),
  remove: (caseId: string, expertId: string) => apiFetch(`/cases/${caseId}/experts/${expertId}`, { method: 'DELETE' }),
};

// Expert comparisons
export const comparisonsApi = {
  listMyCases: () => apiFetch('/expert/cases'),
  getCaseDetail: (caseId: string) => apiFetch(`/expert/cases/${caseId}`),
  submit: (caseId: string, data: object) => apiFetch(`/expert/cases/${caseId}/comparisons`, { method: 'POST', body: JSON.stringify(data) }),
  list: (caseId: string) => apiFetch(`/expert/cases/${caseId}/comparisons`),
};

// Results
export const resultsApi = {
  progress: (caseId: string) => apiFetch(`/cases/${caseId}/progress`),
  aggregate: (caseId: string) => apiFetch(`/cases/${caseId}/aggregate`, { method: 'POST' }),
  get: (caseId: string) => apiFetch(`/cases/${caseId}/results`),
};
