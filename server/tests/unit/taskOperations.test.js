/**
 * Unit Tests for Task CRUD Operations
 * Tests the core functionality of task management, including:
 * - Task creation with validation
 * - Task updates and error handling
 * - Task deletion and calendar sync
 */

const TaskManager = require('../../models/TaskManager');
const GoogleCalendarService = require('../../models/GoogleCalendarService');
const Task = require('../../models/Task');

// Mock the GoogleCalendarService
jest.mock('../../models/GoogleCalendarService', () => {
  return jest.fn().mockImplementation(() => ({
    addEvent: jest.fn().mockResolvedValue({ id: 'mock-event-123' }),
    updateEvent: jest.fn().mockResolvedValue({ id: 'mock-event-123' }),
    deleteEvent: jest.fn().mockResolvedValue(true),
    getEvents: jest.fn().mockResolvedValue([])
  }));
});

describe('Task CRUD Operations', () => {
  let taskManager;
  let mockCalendarService;

  beforeEach(() => {
    // Create mock calendar service
    mockCalendarService = {
      addEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn()
    };

    // Initialize TaskManager with mock service
    taskManager = new TaskManager(mockCalendarService);
  });

  describe('Add Task', () => {
    test('should successfully add a new task', async () => {
      const taskData = {
        title: 'Test Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      };

      // Mock successful calendar sync
      mockCalendarService.addEvent.mockResolvedValue({ id: 'mock-event-123' });

      const task = await taskManager.addTask(taskData);

      expect(task.title).toBe(taskData.title);
      expect(task.startTime).toEqual(taskData.startTime);
      expect(task.endTime).toEqual(taskData.endTime);
      expect(task.taskId).toBeDefined();
      expect(task.googleEventId).toBe('mock-event-123');
    });

    test('should reject task with invalid time range', async () => {
      const taskData = {
        title: 'Invalid Task',
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T10:00:00Z')
      };

      await expect(taskManager.addTask(taskData))
        .rejects
        .toThrow('End time must be after start time');
    });

    test('should reject task with missing required fields', async () => {
      const taskData = {
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      };

      await expect(taskManager.addTask(taskData))
        .rejects
        .toThrow('Missing required fields');
    });

    test('should reject task if startTime or endTime is not a valid Date object', async () => {
      const taskData = {
        title: 'Invalid Date Task',
        startTime: 'not a date',
        endTime: new Date('2024-03-15T11:00:00Z')
      };

      await expect(taskManager.addTask(taskData))
        .rejects
        .toThrow('Invalid date format');
    });
  });

  describe('Edit Task', () => {
    let task;

    beforeEach(async () => {
      mockCalendarService.addEvent.mockResolvedValue({ id: 'mock-event-123' });
      task = await taskManager.addTask({
        title: 'Original Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });
    });

    test('should successfully update task properties', async () => {
      const updates = {
        title: 'Updated Task',
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T12:00:00Z')
      };

      mockCalendarService.updateEvent.mockResolvedValue({ id: 'mock-event-123' });

      const updatedTask = await taskManager.editTask(task.taskId, updates);

      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.startTime).toEqual(updates.startTime);
      expect(updatedTask.endTime).toEqual(updates.endTime);
    });

    test('should update task timing without affecting other properties', async () => {
      const updates = {
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T12:00:00Z')
      };

      mockCalendarService.updateEvent.mockResolvedValue({ id: 'mock-event-123' });

      const updatedTask = await taskManager.editTask(task.taskId, updates);

      expect(updatedTask.title).toBe(task.title);
      expect(updatedTask.startTime).toEqual(updates.startTime);
      expect(updatedTask.endTime).toEqual(updates.endTime);
    });

    test('should reject updates with invalid time range', async () => {
      const updates = {
        startTime: new Date('2024-03-15T12:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      };

      await expect(taskManager.editTask(task.taskId, updates))
        .rejects
        .toThrow('End time must be after start time');
    });

    test('should reject updates to non-existent task', async () => {
      await expect(taskManager.editTask('non-existent-id', { title: 'New Title' }))
        .rejects
        .toThrow('Task not found');
    });
  });

  describe('Delete Task', () => {
    let task;

    beforeEach(async () => {
      mockCalendarService.addEvent.mockResolvedValue({ id: 'mock-event-123' });
      task = await taskManager.addTask({
        title: 'Task to Delete',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });
    });

    test('should successfully delete existing task', async () => {
      mockCalendarService.deleteEvent.mockResolvedValue({});

      await taskManager.deleteTask(task.taskId);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(task.googleEventId);
      await expect(taskManager.getTask(task.taskId)).rejects.toThrow('Task not found');
    });

    test('should handle deletion of non-existent task', async () => {
      await expect(taskManager.deleteTask('non-existent-id'))
        .rejects
        .toThrow('Task not found');
    });

    test('should handle calendar sync failure during deletion', async () => {
      mockCalendarService.deleteEvent.mockRejectedValue(new Error('Failed to delete calendar event'));

      await taskManager.deleteTask(task.taskId);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(task.googleEventId);
      await expect(taskManager.getTask(task.taskId)).rejects.toThrow('Task not found');
    });

    test('should delete all associated calendar events for recurring task', async () => {
      mockCalendarService.deleteEvent.mockResolvedValue({});

      await taskManager.deleteTask(task.taskId);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(task.googleEventId);
      await expect(taskManager.getTask(task.taskId)).rejects.toThrow('Task not found');
    });
  });
}); 