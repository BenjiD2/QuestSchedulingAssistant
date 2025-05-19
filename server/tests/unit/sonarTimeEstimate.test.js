/**
 * Unit Tests for Sonar API Time Estimation
 * Tests the integration with Perplexity's Sonar API for generating time estimates for tasks.
 */

const SonarTimeEstimator = require('../../services/SonarTimeEstimator');

// Mock the Sonar client
jest.mock('../../services/sonarClient', () => ({
  createChatCompletion: jest.fn()
}));

describe('Sonar Time Estimation', () => {
  let sonarTimeEstimator;
  let mockSonarClient;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock Sonar client
    mockSonarClient = {
      createChatCompletion: jest.fn()
    };
    
    sonarTimeEstimator = new SonarTimeEstimator(mockSonarClient);
  });

  describe('Task Input Validation', () => {
    it('should reject empty task descriptions', async () => {
      await expect(sonarTimeEstimator.estimateTime('')).rejects.toThrow('Task description cannot be empty');
    });

    it('should reject task descriptions that are too short', async () => {
      await expect(sonarTimeEstimator.estimateTime('short')).rejects.toThrow('Task description must be at least 10 characters');
    });

    it('should accept valid task descriptions', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              hours: 1,
              minutes: 30,
              reasoning: 'This is a test reasoning'
            })
          }
        }]
      });

      const result = await sonarTimeEstimator.estimateTime('This is a valid task description that is long enough');
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(30);
      expect(result.reasoning).toBe('This is a test reasoning');
    });
  });

  describe('API Request Formatting', () => {
    it('should construct a valid API request object', async () => {
      const taskDescription = 'This is a test task description';
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              hours: 1,
              minutes: 30,
              reasoning: 'Test reasoning'
            })
          }
        }]
      });

      await sonarTimeEstimator.estimateTime(taskDescription);

      expect(mockSonarClient.createChatCompletion).toHaveBeenCalledWith(expect.objectContaining({
        model: 'sonar',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.any(String)
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(taskDescription)
          })
        ])
      }));
    });
  });

  describe('Response Parsing', () => {
    it('should correctly extract time estimate from API response', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              hours: 2,
              minutes: 15,
              reasoning: 'Test reasoning'
            })
          }
        }]
      });

      const result = await sonarTimeEstimator.estimateTime('Test task description');
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(15);
    });

    it('should handle decimal hours in response', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              hours: 1.5,
              minutes: 0,
              reasoning: 'Test reasoning'
            })
          }
        }]
      });

      const result = await sonarTimeEstimator.estimateTime('Test task description');
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting gracefully', async () => {
      mockSonarClient.createChatCompletion.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });

      const result = await sonarTimeEstimator.estimateTime('Test task description');
      expect(result.isEstimated).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
    });

    it('should handle network failures', async () => {
      mockSonarClient.createChatCompletion.mockRejectedValue({
        message: 'Network error'
      });

      const result = await sonarTimeEstimator.estimateTime('Test task description');
      expect(result.isEstimated).toBe(false);
      expect(result.error).toBe('network error');
    });

    it('should handle malformed API responses', async () => {
      mockSonarClient.createChatCompletion.mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      });

      const result = await sonarTimeEstimator.estimateTime('Test task description');
      expect(result.isEstimated).toBe(false);
      expect(result.error).toBe('Failed to parse API response');
    });
  });
}); 