/**
 * Unit Tests for Task Model
 * These tests verify the core functionality of the Task entity,
 * focusing on task creation and update validation.
 */

const Task = require('../../models/Task');

describe('Task Model Tests', () => {
  describe('Task Update Validation', () => {
    let task;

    beforeEach(() => {
      // Initialize a test task with valid default values
      task = new Task({
        taskId: '123',
        title: 'Test Task',
        description: 'Test Description',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        recurrence: 'none',
        location: 'Test Location'
      });
    });

    // Core functionality: Basic task property updates
    test('should successfully update valid task properties', () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        startTime: new Date('2024-03-15T11:00:00'),
        endTime: new Date('2024-03-15T12:00:00'),
        location: 'Updated Location'
      };
      
      task.update(updates);
      
      // Verify all properties are updated correctly
      expect(task.title).toBe(updates.title);
      expect(task.description).toBe(updates.description);
      expect(task.startTime).toEqual(updates.startTime);
      expect(task.endTime).toEqual(updates.endTime);
      expect(task.location).toBe(updates.location);
    });

    // Time validation: Ensure task times are logically valid
    test('should throw error when end time is before start time', () => {
      const updates = {
        startTime: new Date('2024-03-15T11:00:00'),
        endTime: new Date('2024-03-15T10:00:00')
      };
      
      expect(() => task.update(updates)).toThrow('End time cannot be before start time');
    });

    // Required field validation
    test('should validate required fields', () => {
      // Title is required for task identification
      expect(() => task.update({ title: '' }))
        .toThrow('Title is required');
      
      // Start time is required for scheduling
      expect(() => task.update({ startTime: null }))
        .toThrow('Start time is required');
    });
  });
});
