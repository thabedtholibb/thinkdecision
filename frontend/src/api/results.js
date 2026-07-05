import apiClient from './client';

export const resultsService = {
  async getResults(caseId, aggregationMethod = 'AIJ') {
    const response = await apiClient.get(
      `/cases/${caseId}/results?method=${aggregationMethod}`
    );
    return response.data;
  },

  async getExpertComparison(caseId) {
    const response = await apiClient.get(`/cases/${caseId}/results/experts-comparison`);
    return response.data;
  },

  async sensitivityAnalysis(caseId, criteriaWeights) {
    const response = await apiClient.post(
      `/cases/${caseId}/results/sensitivity`,
      { criteriaWeights }
    );
    return response.data;
  },
};
