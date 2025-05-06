/**
 * Unit Tests for Task Model
 * Tests the core functionality of task validation and updates
 */

const Task = require('../../models/Task');

describe('Task Model Tests', () => {
  describe('Task Update Validation', () => {
    let task;

    beforeEach(() => {
      task = new Task({
        title: 'Test Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });
    });

    test('should successfully update valid task properties', () => {
      const updates = {
        title: 'Updated Task',
        description: 'New description',
        location: 'New Location'
      };

      task.update(updates);

      expect(task.title).toBe(updates.title);
      expect(task.description).toBe(updates.description);
      expect(task.location).toBe(updates.location);
    });

    test('should throw error when end time is before start time', () => {
      const updates = {
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T10:00:00Z')
      };
      
      expect(() => task.update(updates)).toThrow('End time must be after start time');
    });

    test('should validate required fields', () => {
      // Title is required for task identification
      expect(() => task.update({ title: '' }))
        .toThrow('Missing required fields');
      
      // Start time is required for scheduling
      expect(() => task.update({ startTime: null }))
        .toThrow('Missing required fields');
    });
  });
});
