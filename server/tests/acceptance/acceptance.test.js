// acceptance.test.js

const request = require('supertest');
const app = require('../../index'); // Assuming your server entry file is index.js in the server folder

// Mock the GoogleCalendarService to control its behavior during tests
jest.mock('../../models/GoogleCalendarService', () => {
  return jest.fn().mockImplementation(() => {
    return {
      fetchEvents: jest.fn().mockResolvedValue([]), // Mock fetchEvents to return an empty array
      // Mock other methods if needed by other tests
    };
  });
});

describe('Acceptance Tests', () => {

  it('should return 200 for the root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Quest Scheduling Assistant API');
  });

  it('should return 400 for invalid input to POST /api/users/xp', async () => {
    // Test case with missing userId
    const invalidDataMissingUserId = { xpGained: 10 };
    const response1 = await request(app)
      .post('/api/users/xp')
      .send(invalidDataMissingUserId);
    expect(response1.statusCode).toBe(400);
    expect(response1.body).toHaveProperty('error');
    expect(response1.body.error).toContain('Invalid userId');

    // Test case with invalid xpGained (not a number)
    const invalidDataInvalidXp = { userId: 'testuser', xpGained: 'abc' };
    const response2 = await request(app)
      .post('/api/users/xp')
      .send(invalidDataInvalidXp);
    expect(response2.statusCode).toBe(400);
    expect(response2.body).toHaveProperty('error');
    expect(response2.body.error).toContain('Invalid xpGained');

    // Test case with invalid xpGained (negative number)
    const invalidDataNegativeXp = { userId: 'testuser', xpGained: -10 };
    const response3 = await request(app)
      .post('/api/users/xp')
      .send(invalidDataNegativeXp);
    expect(response3.statusCode).toBe(400);
    expect(response3.body).toHaveProperty('error');
    expect(response3.body.error).toContain('Invalid xpGained');
  });

  it('should return 400 if token is missing for GET /calendar/events', async () => {
    const response = await request(app).get('/calendar/events');
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Access token is required');
  });

  // Placeholder test for time estimation endpoint
  // This test assumes there is a POST endpoint under /api that handles time estimation
  // You will need to adjust the endpoint path and request/response structure
  // based on your actual implementation.
  it('should respond to the time estimation endpoint', async () => {
    // Assuming an endpoint like /api/estimate-time exists
    // and accepts a POST request with a task description
    const testTask = { description: 'Write acceptance tests' };
    const response = await request(app)
      .post('/api/estimate-time') // <-- Replace with your actual time estimation endpoint
      .send(testTask);

    // This test only checks if the endpoint is reachable and responds, not the actual estimation logic
    // You might expect a 200 or 201 status code depending on your implementation
    // And potentially check for a basic structure in the response body
    expect(response.statusCode).toBeGreaterThanOrEqual(200); // Expecting a success status code
    expect(response.statusCode).toBeLessThan(500); // But not a server error
    // expect(response.body).toHaveProperty('estimatedTime'); // Uncomment and adjust based on your response structure
  });

  // Add more tests here for other functionalities that don't require persistence,
  // such as other input validations, or basic route accessibility checks.

}); 