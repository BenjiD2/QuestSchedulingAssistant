/**
 * Integration Tests for TaskManager Service
 * Tests the interaction between TaskManager and GoogleCalendarService,
 * focusing on task updates and calendar synchronization.
 */

const TaskManager = require('../../services/TaskManager');
const GoogleCalendarService = require('../../services/GoogleCalendarService');

// Mock external calendar service to isolate TaskManager testing
jest.mock('../../services/GoogleCalendarService');

describe('TaskManager Integration Tests', () => {
  let taskManager;
  let mockCalendarService;

  beforeEach(() => {
    // Reset mock state between tests
    jest.clearAllMocks();
    
    // Setup mock calendar service with default success response
    mockCalendarService = new GoogleCalendarService();
    mockCalendarService.createOrUpdateEvent.mockResolvedValue({ eventId: 'test123' });
    
    taskManager = new TaskManager(mockCalendarService);
  });

  describe('Update Schedule Tests', () => {
    // Core functionality: Task update with calendar sync
    test('should successfully update task and sync with calendar', async () => {
      const taskId = '123';
      const updates = {
        title: 'Updated Task',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        location: 'New Location'
      };

      await taskManager.editTask(taskId, updates);

      // Verify local task state
      const updatedTask = await taskManager.getAllTasks().find(t => t.taskId === taskId);
      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.startTime).toEqual(updates.startTime);

      // Verify calendar synchronization
      expect(mockCalendarService.createOrUpdateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updates.title,
          startTime: updates.startTime,
          endTime: updates.endTime,
          location: updates.location
        })
      );
    });

    // Error handling: Calendar sync failure
    test('should handle calendar sync failure gracefully', async () => {
      mockCalendarService.createOrUpdateEvent.mockRejectedValue(new Error('Calendar API Error'));

      const taskId = '123';
      const updates = {
        title: 'Updated Task'
      };

      // Verify error propagation
      await expect(taskManager.editTask(taskId, updates))
        .rejects
        .toThrow('Failed to sync task with calendar');

      // Verify local state remains unchanged
      const task = await taskManager.getAllTasks().find(t => t.taskId === taskId);
      expect(task.title).not.toBe(updates.title);
    });

    // Concurrency handling
    test('should handle concurrent updates correctly', async () => {
      const taskId = '123';
      const updates1 = { title: 'Update 1' };
      const updates2 = { title: 'Update 2' };

      // Simulate concurrent update requests
      const update1Promise = taskManager.editTask(taskId, updates1);
      const update2Promise = taskManager.editTask(taskId, updates2);

      await Promise.all([update1Promise, update2Promise]);

      // Verify final state reflects last update
      const task = await taskManager.getAllTasks().find(t => t.taskId === taskId);
      expect(task.title).toBe('Update 2');
      
      // Verify both updates were synced to calendar
      expect(mockCalendarService.createOrUpdateEvent).toHaveBeenCalledTimes(2);
    });
  });
});
