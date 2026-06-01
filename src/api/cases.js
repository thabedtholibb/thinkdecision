import apiClient from './client';

export const casesService = {
  async createCase(caseData) {
    const response = await apiClient.post('/cases', {
      name: caseData.name,
      description: caseData.description,
      objective: caseData.objective,
      method: caseData.method,
      deadline: caseData.deadline,
      goal: caseData.goal,
      criteria: caseData.criteria,
      alternatives: caseData.alternatives,
      dependencies: caseData.dependencies || [],
      experts: caseData.experts || [],
    });
    return response.data;
  },

  async getCases(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.method) params.append('method', filters.method);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/cases?${params.toString()}`);
    return response.data;
  },

  async getCaseById(caseId) {
    const response = await apiClient.get(`/cases/${caseId}`);
    return response.data;
  },

  async publishCase(caseId) {
    const response = await apiClient.post(`/cases/${caseId}/publish`, {});
    return response.data;
  },
};
