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
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new TaskManager instance for each test
    taskManager = new TaskManager();
    
    // Get the mocked calendar service instance
    mockCalendarService = taskManager.calendarService;
  });

  describe('Add Task', () => {
    test('should successfully add a new task', async () => {
      const taskData = {
        title: 'Test Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      };

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
        title: 'Incomplete Task'
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
    test('should successfully update task properties', async () => {
      // Create initial task
      const task = await taskManager.addTask({
        title: 'Original Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      // Update task
      const updates = {
        title: 'Updated Task',
        description: 'New description'
      };

      const updatedTask = await taskManager.editTask(task.taskId, updates);

      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.description).toBe(updates.description);
      expect(updatedTask.startTime).toEqual(task.startTime);
      expect(updatedTask.endTime).toEqual(task.endTime);
    });

    test('should update task timing without affecting other properties', async () => {
      // Create initial task
      const task = await taskManager.addTask({
        title: 'Time Update Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z'),
        description: 'Original description'
      });

      // Update timing
      const updates = {
        startTime: new Date('2024-03-15T11:00:00Z'),
        endTime: new Date('2024-03-15T12:00:00Z')
      };

      const updatedTask = await taskManager.editTask(task.taskId, updates);

      expect(updatedTask.startTime).toEqual(updates.startTime);
      expect(updatedTask.endTime).toEqual(updates.endTime);
      expect(updatedTask.title).toBe(task.title);
      expect(updatedTask.description).toBe(task.description);
    });

    test('should reject updates with invalid time range', async () => {
      // Create initial task
      const task = await taskManager.addTask({
        title: 'Invalid Update Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      // Try invalid update
      const updates = {
        startTime: new Date('2024-03-15T12:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      };

      await expect(taskManager.editTask(task.taskId, updates))
        .rejects
        .toThrow('End time must be after start time');
    });

    test('should reject updates to non-existent task', async () => {
      const updates = {
        title: 'Updated Title'
      };

      await expect(taskManager.editTask('nonexistent-id', updates))
        .rejects
        .toThrow('Task not found');
    });
  });

  describe('Delete Task', () => {
    test('should successfully delete existing task', async () => {
      // Create task to delete
      const task = await taskManager.addTask({
        title: 'Task to Delete',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      await taskManager.deleteTask(task.taskId);

      // Verify task is deleted
      const allTasks = await taskManager.getAllTasks();
      expect(allTasks.find(t => t.taskId === task.taskId)).toBeUndefined();
    });

    test('should handle deletion of non-existent task', async () => {
      await expect(taskManager.deleteTask('nonexistent-id'))
        .rejects
        .toThrow('Task not found');
    });

    test('should handle calendar sync failure during deletion', async () => {
      // Create task to delete
      const taskToDelete = await taskManager.addTask({
        title: 'Sync Fail Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z')
      });

      // Mock calendar sync failure
      mockCalendarService.deleteEvent.mockRejectedValueOnce(new Error('Failed to delete calendar event'));

      await expect(taskManager.deleteTask(taskToDelete.taskId))
        .rejects
        .toThrow('Failed to delete calendar event');

      // Verify task still exists locally
      const allTasks = await taskManager.getAllTasks();
      expect(allTasks.find(t => t.taskId === taskToDelete.taskId)).toBeDefined();
    });

    test('should delete all associated calendar events for recurring task', async () => {
      // Create recurring task
      const task = await taskManager.addTask({
        title: 'Recurring Task',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z'),
        recurrence: 'FREQ=WEEKLY;COUNT=4'
      });

      // Mock successful deletion
      mockCalendarService.deleteEvent.mockResolvedValue({});

      await taskManager.deleteTask(task.taskId);

      // Verify recurring event deletion is called first
      expect(mockCalendarService.deleteEvent).toHaveBeenNthCalledWith(
        1,
        `recurring_${task.googleEventId}`
      );

      // Verify original event deletion is called second
      expect(mockCalendarService.deleteEvent).toHaveBeenNthCalledWith(
        2,
        task.googleEventId
      );
    });
  });
}); 