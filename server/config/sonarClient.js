const axios = require('axios');

class SonarClient {
  constructor() {
    this.apiKey = process.env.SONAR_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
  }

  async createChatCompletion(requestBody) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SonarClient; 