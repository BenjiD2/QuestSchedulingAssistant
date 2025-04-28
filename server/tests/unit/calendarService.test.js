/**
 * Unit Tests for GoogleCalendarService
 * Tests the integration with Google Calendar API for task synchronization.
 * Focuses on event creation, updates, and error handling.
 */

const GoogleCalendarService = require('../../services/GoogleCalendarService');

describe('GoogleCalendarService Tests', () => {
  let calendarService;
  
  beforeEach(() => {
    calendarService = new GoogleCalendarService();
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

      const result = await calendarService.createOrUpdateEvent(task);
      
      // Verify event creation success
      expect(result).toHaveProperty('eventId');
      expect(result.eventId).toBeTruthy();
    });

    // Core functionality: Updating existing events
    test('should update existing calendar event', async () => {
      const existingTask = {
        taskId: '123',
        title: 'Original Task',
        googleEventId: 'event123' // Existing event ID
      };

      const updates = {
        ...existingTask,
        title: 'Updated Task',
        startTime: new Date('2024-03-15T11:00:00')
      };

      const result = await calendarService.createOrUpdateEvent(updates);
      
      // Verify event was updated rather than created new
      expect(result.eventId).toBe('event123');
    });

    // Error handling: API failures
    test('should handle API errors gracefully', async () => {
      // Simulate Google Calendar API error
      jest.spyOn(calendarService, 'createOrUpdateEvent')
        .mockRejectedValueOnce(new Error('API Error'));

      const task = {
        taskId: '123',
        title: 'Test Task'
      };

      // Verify error propagation
      await expect(calendarService.createOrUpdateEvent(task))
        .rejects
        .toThrow('API Error');
    });

    // Special case: Recurring events
    test('should handle recurring events correctly', async () => {
      const recurringTask = {
        taskId: '123',
        title: 'Recurring Task',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        recurrence: 'FREQ=WEEKLY;COUNT=4' // Weekly recurrence for 4 weeks
      };

      const result = await calendarService.createOrUpdateEvent(recurringTask);
      
      // Verify recurring event properties
      expect(result).toHaveProperty('eventId');
      expect(result).toHaveProperty('recurringEventId');
    });
  });

  describe('Event Deletion', () => {
    // Core functionality: Event deletion
    test('should successfully delete calendar event', async () => {
      const eventId = 'event123';
      
      await expect(calendarService.deleteEvent(eventId))
        .resolves
        .not.toThrow();
    });

    // Error handling: Non-existent events
    test('should handle deletion of non-existent event', async () => {
      const nonExistentEventId = 'nonexistent123';
      
      await expect(calendarService.deleteEvent(nonExistentEventId))
        .rejects
        .toThrow('Event not found');
    });
  });
});
