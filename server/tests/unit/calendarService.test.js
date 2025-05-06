/**
 * Unit Tests for GoogleCalendarService
 * Tests the integration with Google Calendar API for task synchronization.
 * Focuses on event creation, updates, and error handling.
 */

const GoogleCalendarService = require('../../models/GoogleCalendarService');
const { google } = require('googleapis');
require('dotenv').config();

// Mock the googleapis calendar
const mockCalendar = {
  events: {
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn()
  }
};

jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn(() => mockCalendar)
  }
}));

describe('GoogleCalendarService Tests', () => {
  let calendarService;
  
  beforeEach(() => {
    // Ensure environment variables are set for testing
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'test-redirect-uri';
    
    calendarService = new GoogleCalendarService();
    // Set mock access token for testing
    calendarService.setAccessToken('mock-access-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
  });

  test('should throw error when environment variables are missing', () => {
    // Remove environment variables
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;

    expect(() => new GoogleCalendarService())
      .toThrow('Missing required Google Calendar credentials in environment variables');
  });

  describe('Calendar Event Updates', () => {
    // Core functionality: Creating new events
    test('should create new calendar event for task', async () => {
      const task = {
        taskId: '123',
        title: 'Test Task',
        description: 'Test Description',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        location: 'Test Location'
      };

      // Mock successful event creation
      mockCalendar.events.insert.mockResolvedValue({
        data: { id: 'new-event-123' }
      });

      const result = await calendarService.createOrUpdateEvent(task);
      
      // Verify event creation success
      expect(result).toHaveProperty('eventId', 'new-event-123');
      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: task.title,
          description: task.description,
          start: expect.any(Object),
          end: expect.any(Object),
          location: task.location
        })
      });
    });

    // Core functionality: Updating existing events
    test('should update existing calendar event', async () => {
      const existingTask = {
        taskId: '123',
        title: 'Updated Task',
        description: 'Updated Description',
        startTime: new Date('2024-03-15T11:00:00'),
        endTime: new Date('2024-03-15T12:00:00'),
        location: 'Updated Location',
        googleEventId: 'event123'
      };

      // Mock successful event update
      mockCalendar.events.update.mockResolvedValue({
        data: { id: 'event123' }
      });

      const result = await calendarService.createOrUpdateEvent(existingTask);
      
      // Verify event was updated
      expect(result.eventId).toBe('event123');
      expect(mockCalendar.events.update).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event123',
        requestBody: expect.objectContaining({
          summary: existingTask.title,
          description: existingTask.description,
          start: expect.any(Object),
          end: expect.any(Object),
          location: existingTask.location
        })
      });
    });

    // Error handling: API failures
    test('should handle API errors gracefully', async () => {
      const task = {
        taskId: '123',
        title: 'Test Task',
        startTime: new Date()
      };

      // Mock API error
      mockCalendar.events.insert.mockRejectedValue(new Error('API Error'));

      // Verify error propagation
      await expect(calendarService.createOrUpdateEvent(task))
        .rejects
        .toThrow('Failed to create/update calendar event: API Error');
    });

    // Special case: Recurring events
    test('should handle recurring events correctly', async () => {
      const recurringTask = {
        taskId: '123',
        title: 'Recurring Task',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        recurrence: 'FREQ=WEEKLY;COUNT=4'
      };

      // Mock successful event creation
      mockCalendar.events.insert.mockResolvedValue({
        data: { id: 'recurring-event-123' }
      });

      const result = await calendarService.createOrUpdateEvent(recurringTask);
      
      // Verify recurring event properties
      expect(result).toHaveProperty('eventId', 'recurring-event-123');
      expect(result).toHaveProperty('recurringEventId', 'recurring_recurring-event-123');
      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          recurrence: ['FREQ=WEEKLY;COUNT=4']
        })
      });
    });
  });

  describe('Event Deletion', () => {
    test('should successfully delete calendar event', async () => {
      const eventId = 'event123';
      
      // Mock successful deletion
      mockCalendar.events.delete.mockResolvedValue({});

      await calendarService.deleteEvent(eventId);

      expect(mockCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: eventId
      });
    });

    test('should handle deletion of non-existent event', async () => {
      const nonExistentEventId = 'nonexistent123';
      
      // Mock deletion error
      mockCalendar.events.delete.mockRejectedValue(new Error('Not Found'));

      await expect(calendarService.deleteEvent(nonExistentEventId))
        .rejects
        .toThrow('Failed to delete calendar event: Not Found');
    });
  });

  describe('Event Fetching', () => {
    test('should fetch events successfully', async () => {
      const mockEvents = [
        { id: 'event1', summary: 'Test Event 1' },
        { id: 'event2', summary: 'Test Event 2' }
      ];

      // Mock successful events list
      mockCalendar.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      const events = await calendarService.fetchEvents('mock-token');
      expect(events).toEqual(mockEvents);
      expect(mockCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: expect.any(String),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });
    });
  });
});
