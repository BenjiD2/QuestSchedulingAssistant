// Service for interacting with the Sonar AI time estimation service.
// Defines the SonarTimeEstimator class responsible for obtaining and processing time estimates for tasks.

const axios = require('axios');

class SonarTimeEstimator {
  constructor(sonarClient) {
    this.sonarClient = sonarClient;
  }

  async estimateTime(taskDescription) {
    // Input validation
    if (!taskDescription) {
      throw new Error('Task description cannot be empty');
    }
    if (taskDescription.length < 10) {
      throw new Error('Task description must be at least 10 characters');
    }

    try {
      const requestBody = {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a task time estimation expert. Provide a brief, clear justification for your time estimate.'
          },
          {
            role: 'user',
            content: `Estimate the time required for the following task and explain your reasoning: ${taskDescription}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                hours: { type: 'number' },
                minutes: { type: 'number' },
                reasoning: { type: 'string' }
              },
              required: ['hours', 'minutes', 'reasoning']
            }
          }
        }
      };

      const response = await this.sonarClient.createChatCompletion(requestBody);
      const content = response.choices[0].message.content;
      const estimate = JSON.parse(content);

      // Convert decimal hours to hours and minutes
      const totalMinutes = Math.round(estimate.hours * 60 + estimate.minutes);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return { 
        hours, 
        minutes, 
        reasoning: estimate.reasoning,
        isEstimated: true 
      };
    } catch (error) {
      // Rate limit error
      if ((error.status === 429) || (error.message && error.message.toLowerCase().includes('rate limit'))) {
        return { hours: 0, minutes: 0, reasoning: 'API rate limit exceeded', isEstimated: false, error: 'API rate limit exceeded' };
      } 
      // Network error
      else if (error.message && error.message.toLowerCase().includes('network')) {
        return { hours: 0, minutes: 0, reasoning: 'Network error occurred', isEstimated: false, error: 'network error' };
      }
      // Authentication error
      else if (error.status === 401 || error.status === 403 || (error.message && error.message.toLowerCase().includes('auth'))) {
        return { hours: 0, minutes: 0, reasoning: 'Authentication error occurred', isEstimated: false, error: 'authentication error' };
      }
      // Timeout error
      else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
        return { hours: 0, minutes: 0, reasoning: 'Request timed out', isEstimated: false, error: 'timeout error' };
      }
      // Parse error
      else {
        return { hours: 0, minutes: 0, reasoning: 'Failed to parse API response', isEstimated: false, error: 'Failed to parse API response' };
      }
    }
  }

  async estimateAndUpdateTask(task) {
    try {
      const estimate = await this.estimateTime(task.description);
      task.updateTimeEstimate(estimate);
      return estimate;
    } catch (error) {
      throw new Error('Failed to update task with time estimate');
    }
  }
}

module.exports = SonarTimeEstimator; 