/**
 * End-to-End Tests for Schedule Update Feature
 * Tests the complete flow of updating task schedules and calendar synchronization.
 * Verifies the integration between Task, TaskManager, and GoogleCalendarService.
 */

const TaskManager = require('../../services/TaskManager');
const GoogleCalendarService = require('../../services/GoogleCalendarService');
const User = require('../../models/User');

describe('Update Schedule End-to-End Tests', () => {
  let taskManager;
  let calendarService;
  let user;

  beforeEach(() => {
    // Initialize services and test user
    calendarService = new GoogleCalendarService();
    taskManager = new TaskManager(calendarService);
    user = new User({
      userId: 'user123',
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  describe('Schedule Update Flow', () => {
    // Core functionality: Batch schedule updates
    test('should update multiple tasks and sync with calendar', async () => {
      // Create initial tasks with sequential times
      const task1 = await taskManager.addTask({
        title: 'Task 1',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00')
      });

      const task2 = await taskManager.addTask({
        title: 'Task 2',
        startTime: new Date('2024-03-15T11:00:00'),
        endTime: new Date('2024-03-15T12:00:00')
      });

      // Define schedule updates
      const updates = [
        {
          taskId: task1.taskId,
          startTime: new Date('2024-03-15T09:00:00'),
          endTime: new Date('2024-03-15T10:00:00')
        },
        {
          taskId: task2.taskId,
          startTime: new Date('2024-03-15T10:00:00'),
          endTime: new Date('2024-03-15T11:00:00')
        }
      ];

      // Apply updates concurrently
      await Promise.all(updates.map(update => 
        taskManager.editTask(update.taskId, update)
      ));

      // Verify schedule changes
      const updatedTasks = await taskManager.getAllTasks();
      const updatedTask1 = updatedTasks.find(t => t.taskId === task1.taskId);
      const updatedTask2 = updatedTasks.find(t => t.taskId === task2.taskId);

      expect(updatedTask1.startTime).toEqual(updates[0].startTime);
      expect(updatedTask2.startTime).toEqual(updates[1].startTime);
    });

    // Validation: Schedule conflicts
    test('should handle schedule conflicts', async () => {
      // Create initial task
      const task1 = await taskManager.addTask({
        title: 'Task 1',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00')
      });

      // Attempt update with overlapping time
      const conflictingUpdate = {
        taskId: task1.taskId,
        startTime: new Date('2024-03-15T10:30:00'),
        endTime: new Date('2024-03-15T11:30:00')
      };

      // Verify conflict detection
      await expect(taskManager.editTask(task1.taskId, conflictingUpdate))
        .rejects
        .toThrow('Schedule conflict detected');
    });

    // Data consistency: Local and remote state
    test('should maintain data consistency between local and calendar', async () => {
      // Create test task
      const task = await taskManager.addTask({
        title: 'Consistency Test',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00')
      });

      // Simulate calendar sync failure
      jest.spyOn(calendarService, 'createOrUpdateEvent')
        .mockRejectedValueOnce(new Error('Calendar sync failed'));

      const update = {
        taskId: task.taskId,
        title: 'Updated Title'
      };

      // Verify update rollback on sync failure
      await expect(taskManager.editTask(task.taskId, update))
        .rejects
        .toThrow('Failed to sync task with calendar');

      // Verify local state remains unchanged
      const localTask = await taskManager.getAllTasks()
        .find(t => t.taskId === task.taskId);
      
      expect(localTask.title).toBe('Consistency Test');
    });
  });
});
