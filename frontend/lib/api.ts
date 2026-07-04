const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiCall<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth endpoints
export async function login(email: string, password: string) {
  return apiCall<{ access_token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string, role: string) {
  return apiCall<{ access_token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

// Cases endpoints
export async function getCases(token: string) {
  return apiCall<any[]>('/api/cases', { token });
}

export async function getCase(id: string, token: string) {
  return apiCall<any>(`/api/cases/${id}`, { token });
}

export async function createCase(data: any, token: string) {
  return apiCall<any>('/api/cases', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function updateCase(id: string, data: any, token: string) {
  return apiCall<any>(`/api/cases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

// Criteria endpoints
export async function getCriteria(caseId: string, token: string) {
  return apiCall<any[]>(`/api/cases/${caseId}/criteria`, { token });
}

export async function addCriteria(caseId: string, data: any, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/criteria`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteCriteria(caseId: string, criteriaId: string, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/criteria/${criteriaId}`, {
    method: 'DELETE',
    token,
  });
}

// Alternatives endpoints
export async function getAlternatives(caseId: string, token: string) {
  return apiCall<any[]>(`/api/cases/${caseId}/alternatives`, { token });
}

export async function addAlternative(caseId: string, data: any, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/alternatives`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteAlternative(caseId: string, altId: string, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/alternatives/${altId}`, {
    method: 'DELETE',
    token,
  });
}

// Experts endpoints
export async function getExperts(caseId: string, token: string) {
  return apiCall<any[]>(`/api/cases/${caseId}/experts`, { token });
}

export async function inviteExpert(caseId: string, email: string, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/experts/invite`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    token,
  });
}

// Comparisons endpoints
export async function getComparison(caseId: string, nodeId: string, expertId: string, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/comparisons/${nodeId}?expert_id=${expertId}`, {
    token,
  });
}

export async function submitComparison(caseId: string, nodeId: string, data: any, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/comparisons/${nodeId}`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

// Results endpoints
export async function getResults(caseId: string, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/results`, { token });
}

export async function aggregateResults(caseId: string, method: string, token: string) {
  return apiCall<any>(`/api/cases/${caseId}/aggregate`, {
    method: 'POST',
    body: JSON.stringify({ method }),
    token,
  });
}
