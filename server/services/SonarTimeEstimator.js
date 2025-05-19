const axios = require('axios');

class SonarTimeEstimator {
  constructor(sonarClient) {
    this.sonarClient = sonarClient;
  }

  async estimateTime(taskDescription) {
    try {
      const requestBody = {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise.'
          },
          {
            role: 'user',
            content: `Estimate the time required for the following task: ${taskDescription}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                hours: { type: 'number' },
                minutes: { type: 'number' }
              },
              required: ['hours', 'minutes']
            }
          }
        }
      };

      const response = await this.sonarClient.createChatCompletion(requestBody);
      const content = response.choices[0].message.content;
      const estimate = JSON.parse(content);
      return { ...estimate, isEstimated: true };
    } catch (error) {
      // Rate limit error (simulate substring match)
      if ((error.status === 429) || (error.message && error.message.toLowerCase().includes('rate limit'))) {
        return { hours: 0, minutes: 0, isEstimated: false, error: 'API rate limit exceeded' };
      } else if (error.message && error.message.toLowerCase().includes('network')) {
        return { hours: 0, minutes: 0, isEstimated: false, error: 'network error' };
      } else {
        return { hours: 0, minutes: 0, isEstimated: false, error: 'parse error' };
      }
    }
  }

  async estimateAndUpdateTask(task) {
    const estimate = await this.estimateTime(task.description);
    task.updateTimeEstimate(estimate);
    return estimate;
  }
}

module.exports = SonarTimeEstimator; 