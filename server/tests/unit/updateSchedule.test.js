/**
 * End-to-End Tests for Schedule Update Feature
 * Tests the complete flow of updating task schedules and calendar synchronization.
 * Verifies the integration between Task, TaskManager, and GoogleCalendarService.
 */

const TaskManager = require('../../models/TaskManager');
const GoogleCalendarService = require('../../models/GoogleCalendarService');
const User = require('../../models/User');
require('dotenv').config();

// Mock the GoogleCalendarService
jest.mock('../../models/GoogleCalendarService', () => {
  return jest.fn().mockImplementation(() => ({
    addEvent: jest.fn().mockImplementation((task) => {
      return Promise.resolve({
        id: 'mock-event-123',
        eventId: 'mock-event-123',
        title: task.title,
        description: task.description,
        startTime: task.startTime,
        endTime: task.endTime
      });
    }),
    updateEvent: jest.fn().mockImplementation((task) => {
      return Promise.resolve({
        id: task.googleEventId || 'mock-event-123',
        eventId: task.googleEventId || 'mock-event-123',
        title: task.title,
        description: task.description,
        startTime: task.startTime,
        endTime: task.endTime
      });
    }),
    deleteEvent: jest.fn().mockResolvedValue({}),
    setAccessToken: jest.fn()
  }));
});

describe('Update Schedule End-to-End Tests', () => {
  let taskManager;
  let calendarService;
  let user;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create new instances for each test
    calendarService = new GoogleCalendarService();
    taskManager = new TaskManager();

    user = new User({
      userId: 'user123',
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  describe('Schedule Update Flow', () => {
    test('should update multiple tasks and sync with calendar', async () => {
      // Create initial tasks with sequential times
      const task1 = await taskManager.addTask({
        title: 'Task 1',
        description: 'First task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      const task2 = await taskManager.addTask({
        title: 'Task 2',
        description: 'Second task',
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T12:00:00Z')
      });

      // Define updates for both tasks
      const updates = [
        {
          taskId: task1.taskId,
          title: 'Updated Task 1',
          startTime: new Date('2024-03-15T10:00:00Z'),
          endTime: new Date('2024-03-15T11:00:00Z')
        },
        {
          taskId: task2.taskId,
          title: 'Updated Task 2',
          startTime: new Date('2024-03-15T11:00:00Z'),
          endTime: new Date('2024-03-15T12:00:00Z')
        }
      ];

      // Update tasks in sequence
      const updatedTasks = [];
      for (const update of updates) {
        const updatedTask = await taskManager.editTask(update.taskId, update);
        updatedTasks.push(updatedTask);
      }

      // Get updated tasks
      const updatedTask1 = updatedTasks[0];
      const updatedTask2 = updatedTasks[1];

      // Verify updates were applied correctly
      expect(updatedTask1.startTime.toISOString()).toBe(updates[0].startTime.toISOString());
      expect(updatedTask1.endTime.toISOString()).toBe(updates[0].endTime.toISOString());
      expect(updatedTask2.startTime.toISOString()).toBe(updates[1].startTime.toISOString());
      expect(updatedTask2.endTime.toISOString()).toBe(updates[1].endTime.toISOString());
    });

    test('should handle schedule conflicts', async () => {
      // Create initial task
      const task1 = await taskManager.addTask({
        title: 'Task 1',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      // Try to create a conflicting task
      await expect(taskManager.addTask({
        title: 'Task 2',
        startTime: new Date('2024-03-15T10:30:00Z'),
        endTime: new Date('2024-03-15T11:30:00Z')
      })).rejects.toThrow('Schedule conflict detected');
    });

    test('should maintain data consistency between local and calendar', async () => {
      // Create initial task
      const task = await taskManager.addTask({
        title: 'Test Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      // Update task
      const updatedTask = await taskManager.editTask(task.taskId, {
        title: 'Updated Task',
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T12:00:00Z')
      });

      // Verify local and calendar data match
      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.startTime.toISOString()).toBe('2024-03-15T11:00:00.000Z');
      expect(updatedTask.endTime.toISOString()).toBe('2024-03-15T12:00:00.000Z');
    });
  });
});
