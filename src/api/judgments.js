import apiClient from './client';

export const judgementsService = {
  async saveJudgment(caseId, expertId, levelId, judgments, notes = '') {
    const response = await apiClient.post(
      `/cases/${caseId}/judgments/${levelId}`,
      { judgments, notes }
    );
    return response.data;
  },

  async submitJudgments(caseId, expertId) {
    const response = await apiClient.post(
      `/cases/${caseId}/${expertId}/submit`,
      { confirmSubmission: true }
    );
    return response.data;
  },
};
