console.error('Failed to analyze text', error);
throw error;
}

async generateSelfAssessmentDraft(): Promise<{ draft: string }> {
  try {
    const response = await apiClient.post<{ draft: string }>('/ai/generate/self-assessment/');
    return response.data;
  } catch (error) {
    console.error('Failed to generate self-assessment draft', error);
    throw error;
  }
}

async generatePeerReviewDraft(toUserId: number, relationship: string): Promise<{ draft: string }> {
  try {
    const response = await apiClient.post<{ draft: string }>('/ai/generate/peer-review/', {
      to_user_id: toUserId,
      relationship: relationship,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate peer review draft', error);
    throw error;
  }
}
}

const aiService = new AIService(); 