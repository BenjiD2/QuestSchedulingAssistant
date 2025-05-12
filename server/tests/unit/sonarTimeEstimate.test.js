/**
 * Unit Tests for Sonar API Time Estimation
 * Tests the integration with Perplexity's Sonar API for generating time estimates for tasks.
 */

const SonarTimeEstimator = require('../../services/SonarTimeEstimator'); // You'll need to create this service

// Create mock for Perplexity API client
const mockSonarClient = {
  createChatCompletion: jest.fn()
};

describe('Sonar Time Estimation', () => {
  let timeEstimator;

  beforeEach(() => {
    // Reset mocks and create fresh instance for each test
    jest.clearAllMocks();
    timeEstimator = new SonarTimeEstimator(mockSonarClient);
  });

  describe('Task Input Validation', () => {
    test('should reject empty task descriptions', async () => {
      await expect(timeEstimator.estimateTime(''))
        .rejects
        .toThrow('Task description cannot be empty');
    });

    test('should reject task descriptions that are too short', async () => {
      await expect(timeEstimator.estimateTime('Task'))
        .rejects
        .toThrow('Task description must be at least 10 characters');
    });

    test('should accept valid task descriptions', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 2, "minutes": 30}' } }]
      });

      await expect(timeEstimator.estimateTime('Implement user authentication with OAuth2'))
        .resolves
        .toBeDefined();
    });
  });

  describe('API Request Formatting', () => {
    test('should construct a valid Perplexity API request object', async () => {
      // Set up mock response
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 2, "minutes": 30}' } }]
      });

      // Call the method
      await timeEstimator.estimateTime('Create a new database schema');

      // Verify correct API request format
      expect(mockSonarClient.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' })
          ]),
          response_format: expect.objectContaining({ 
            type: 'json_schema',
            json_schema: expect.any(Object)
          })
        })
      );
    });

    test('should include task description in the API request', async () => {
      // Set up mock response
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 1, "minutes": 45}' } }]
      });

      const taskDescription = 'Implement login functionality';
      
      // Call the method
      await timeEstimator.estimateTime(taskDescription);

      // Verify task description is included in the request
      const requestArg = mockSonarClient.createChatCompletion.mock.calls[0][0];
      const userMessage = requestArg.messages.find(m => m.role === 'user');
      expect(userMessage.content).toContain(taskDescription);
    });

    test('should include task complexity hints in the prompt', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 2, "minutes": 30}' } }]
      });

      const taskDescription = 'Implement complex database migration';
      
      await timeEstimator.estimateTime(taskDescription);

      const requestArg = mockSonarClient.createChatCompletion.mock.calls[0][0];
      const userMessage = requestArg.messages.find(m => m.role === 'user');
      expect(userMessage.content).toContain('complex');
      expect(userMessage.content).toContain('database migration');
    });
  });

  describe('Structured Output Handling', () => {
    test('should request time estimates in structured JSON format', async () => {
      // Set up mock response
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 3, "minutes": 15}' } }]
      });

      // Call the method
      await timeEstimator.estimateTime('Build a React component');

      // Verify JSON schema format is correct
      const requestArg = mockSonarClient.createChatCompletion.mock.calls[0][0];
      expect(requestArg.response_format.type).toBe('json_schema');
      expect(requestArg.response_format.json_schema).toHaveProperty('schema');
      
      // Verify schema has hours and minutes properties
      const schema = requestArg.response_format.json_schema.schema;
      expect(schema.properties).toHaveProperty('hours');
      expect(schema.properties).toHaveProperty('minutes');
    });
  });

  describe('Response Parsing', () => {
    test('should correctly extract time estimate from API response', async () => {
      // Set up mock response
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 3, "minutes": 0}' } }]
      });

      // Call the method
      const estimate = await timeEstimator.estimateTime('Set up user authentication');

      // Verify correct parsing of response with reasoning
      expect(estimate).toHaveProperty('hours', 3);
      expect(estimate).toHaveProperty('minutes', 0);
    });

    test('should handle decimal hours in response', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 1.5, "minutes": 0}' } }]
      });

      const estimate = await timeEstimator.estimateTime('Code review');
      expect(estimate).toEqual({
        hours: 1,
        minutes: 30,
        isEstimated: true
      });
    });

    test('should handle zero duration tasks', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 0, "minutes": 0}' } }]
      });

      const estimate = await timeEstimator.estimateTime('Quick documentation update');
      expect(estimate).toEqual({
        hours: 0,
        minutes: 0,
        isEstimated: true
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API rate limiting gracefully', async () => {
      // Set up mock to simulate rate limiting
      mockSonarClient.createChatCompletion.mockRejectedValueOnce({
        status: 429,
        message: 'Rate limit exceeded'
      });

      // Call the method and verify it handles the error
      await expect(timeEstimator.estimateTime('Deploy app to production'))
        .resolves
        .toEqual(expect.objectContaining({
          hours: expect.any(Number),
          minutes: expect.any(Number),
          isEstimated: false,
          error: expect.stringContaining('rate limit')
        }));
    });

    test('should handle network failures', async () => {
      // Set up mock to simulate network error
      mockSonarClient.createChatCompletion.mockRejectedValueOnce(
        new Error('Network error')
      );

      // Call the method and verify it handles the error
      await expect(timeEstimator.estimateTime('Fix CSS styling issues'))
        .resolves
        .toEqual(expect.objectContaining({
          hours: expect.any(Number),
          minutes: expect.any(Number),
          isEstimated: false,
          error: expect.stringContaining('network')
        }));
    });

    test('should handle malformed API responses', async () => {
      // Set up mock with invalid JSON response
      mockSonarClient.createChatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'This task will take about 2-3 hours' } }]
      });

      // Call the method and verify it handles parsing error
      await expect(timeEstimator.estimateTime('Create documentation'))
        .resolves
        .toEqual(expect.objectContaining({
          hours: expect.any(Number),
          minutes: expect.any(Number),
          isEstimated: false,
          error: expect.stringContaining('parse')
        }));
    });

    test('should handle API authentication errors', async () => {
      mockSonarClient.createChatCompletion.mockRejectedValueOnce({
        status: 401,
        message: 'Invalid API key'
      });

      await expect(timeEstimator.estimateTime('Implement feature'))
        .resolves
        .toEqual(expect.objectContaining({
          hours: expect.any(Number),
          minutes: expect.any(Number),
          isEstimated: false,
          error: expect.stringContaining('authentication')
        }));
    });

    test('should handle timeout errors', async () => {
      mockSonarClient.createChatCompletion.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Request timed out'
      });

      await expect(timeEstimator.estimateTime('Implement feature'))
        .resolves
        .toEqual(expect.objectContaining({
          hours: expect.any(Number),
          minutes: expect.any(Number),
          isEstimated: false,
          error: expect.stringContaining('timeout')
        }));
    });
  });

  describe('Integration with Tasks', () => {
    test('should update task with time estimate', async () => {
      // Set up mock response
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 1, "minutes": 15}' } }]
      });

      // Mock task object
      const task = {
        title: 'Refactor database queries',
        description: 'Optimize slow database queries',
        updateTimeEstimate: jest.fn()
      };

      // Call the method
      await timeEstimator.estimateAndUpdateTask(task);

      // Verify task was updated with estimate
      expect(task.updateTimeEstimate).toHaveBeenCalledWith({
        hours: 1,
        minutes: 15,
        isEstimated: true
      });
    });

    test('should preserve existing task properties when updating time estimate', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 1, "minutes": 15}' } }]
      });

      const task = {
        id: '123',
        title: 'Refactor database queries',
        description: 'Optimize slow database queries',
        startTime: '2024-03-20T10:00:00Z',
        endTime: '2024-03-20T11:00:00Z',
        updateTimeEstimate: jest.fn()
      };

      await timeEstimator.estimateAndUpdateTask(task);

      expect(task.updateTimeEstimate).toHaveBeenCalledWith({
        hours: 1,
        minutes: 15,
        isEstimated: true
      });
      // Verify other task properties remain unchanged
      expect(task).toHaveProperty('id', '123');
      expect(task).toHaveProperty('title', 'Refactor database queries');
      expect(task).toHaveProperty('startTime', '2024-03-20T10:00:00Z');
    });

    test('should handle task update failures gracefully', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{ message: { content: '{"hours": 1, "minutes": 15}' } }]
      });

      const task = {
        title: 'Refactor database queries',
        updateTimeEstimate: jest.fn().mockRejectedValue(new Error('Update failed'))
      };

      await expect(timeEstimator.estimateAndUpdateTask(task))
        .rejects
        .toThrow('Failed to update task with time estimate');
    });
  });
}); 