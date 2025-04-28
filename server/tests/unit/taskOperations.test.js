/**
 * Unit Tests for Task CRUD Operations
 * Tests the core functionality of adding, editing, and deleting tasks,
 * including validation and error cases.
 */

const TaskManager = require('../../services/TaskManager');
const GoogleCalendarService = require('../../services/GoogleCalendarService');
const Task = require('../../models/Task');

// Mock the calendar service
jest.mock('../../services/GoogleCalendarService');

describe('Task CRUD Operations', () => {
  let taskManager;
  let mockCalendarService;

  beforeEach(() => {
    // Reset mocks and create fresh instances for each test
    jest.clearAllMocks();
    mockCalendarService = new GoogleCalendarService();
    mockCalendarService.createOrUpdateEvent.mockResolvedValue({ eventId: 'test123' });
    taskManager = new TaskManager(mockCalendarService);
  });

  describe('Add Task', () => {
    test('should successfully add a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task Description',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        location: 'Room 101'
      };

      const result = await taskManager.addTask(newTask);

      // Verify task was created with correct properties
      expect(result.taskId).toBeDefined();
      expect(result.title).toBe(newTask.title);
      expect(result.description).toBe(newTask.description);
      expect(result.startTime).toEqual(newTask.startTime);
      expect(result.endTime).toEqual(newTask.endTime);
      expect(result.location).toBe(newTask.location);

      // Verify calendar event was created
      expect(mockCalendarService.createOrUpdateEvent).toHaveBeenCalledWith(
        expect.objectContaining(newTask)
      );
    });

    test('should reject task with invalid time range', async () => {
      const invalidTask = {
        title: 'Invalid Task',
        startTime: new Date('2024-03-15T11:00:00'),
        endTime: new Date('2024-03-15T10:00:00') // End before start
      };

      await expect(taskManager.addTask(invalidTask))
        .rejects
        .toThrow('End time cannot be before start time');
    });

    test('should reject task with missing required fields', async () => {
      const incompleteTask = {
        description: 'No title or times'
      };

      await expect(taskManager.addTask(incompleteTask))
        .rejects
        .toThrow('Required fields missing');
    });
  });

  describe('Edit Task', () => {
    let existingTask;

    beforeEach(async () => {
      // Create a task to edit
      existingTask = await taskManager.addTask({
        title: 'Original Task',
        description: 'Original Description',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00')
      });
    });

    test('should successfully update task properties', async () => {
      const updates = {
        title: 'Updated Task',
        description: 'Updated Description',
        location: 'New Location'
      };

      const updatedTask = await taskManager.editTask(existingTask.taskId, updates);

      // Verify updates were applied
      expect(updatedTask.title).toBe(updates.title);
      expect(updatedTask.description).toBe(updates.description);
      expect(updatedTask.location).toBe(updates.location);
      // Verify unchanged properties remain
      expect(updatedTask.startTime).toEqual(existingTask.startTime);
      expect(updatedTask.endTime).toEqual(existingTask.endTime);

      // Verify calendar event was updated
      expect(mockCalendarService.createOrUpdateEvent).toHaveBeenCalledWith(
        expect.objectContaining(updates)
      );
    });

    test('should update task timing without affecting other properties', async () => {
      const timeUpdate = {
        startTime: new Date('2024-03-15T14:00:00'),
        endTime: new Date('2024-03-15T15:00:00')
      };

      const updatedTask = await taskManager.editTask(existingTask.taskId, timeUpdate);

      // Verify time updates
      expect(updatedTask.startTime).toEqual(timeUpdate.startTime);
      expect(updatedTask.endTime).toEqual(timeUpdate.endTime);
      // Verify other properties unchanged
      expect(updatedTask.title).toBe(existingTask.title);
      expect(updatedTask.description).toBe(existingTask.description);
    });

    test('should reject updates with invalid time range', async () => {
      const invalidUpdate = {
        startTime: new Date('2024-03-15T11:00:00'),
        endTime: new Date('2024-03-15T10:00:00')
      };

      await expect(taskManager.editTask(existingTask.taskId, invalidUpdate))
        .rejects
        .toThrow('End time cannot be before start time');
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
    let taskToDelete;

    beforeEach(async () => {
      // Create a task to delete
      taskToDelete = await taskManager.addTask({
        title: 'Task to Delete',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00')
      });
    });

    test('should successfully delete existing task', async () => {
      await taskManager.deleteTask(taskToDelete.taskId);

      // Verify task was removed
      const allTasks = await taskManager.getAllTasks();
      expect(allTasks).not.toContainEqual(
        expect.objectContaining({ taskId: taskToDelete.taskId })
      );

      // Verify calendar event was deleted
      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(
        taskToDelete.googleEventId
      );
    });

    test('should handle deletion of non-existent task', async () => {
      await expect(taskManager.deleteTask('nonexistent-id'))
        .rejects
        .toThrow('Task not found');
    });

    test('should handle calendar sync failure during deletion', async () => {
      // Simulate calendar deletion failure
      mockCalendarService.deleteEvent.mockRejectedValueOnce(
        new Error('Calendar API Error')
      );

      await expect(taskManager.deleteTask(taskToDelete.taskId))
        .rejects
        .toThrow('Failed to delete calendar event');

      // Verify task still exists locally
      const allTasks = await taskManager.getAllTasks();
      expect(allTasks).toContainEqual(
        expect.objectContaining({ taskId: taskToDelete.taskId })
      );
    });

    test('should delete all associated calendar events for recurring task', async () => {
      const recurringTask = await taskManager.addTask({
        title: 'Recurring Task',
        startTime: new Date('2024-03-15T10:00:00'),
        endTime: new Date('2024-03-15T11:00:00'),
        recurrence: 'FREQ=WEEKLY;COUNT=4'
      });

      await taskManager.deleteTask(recurringTask.taskId);

      // Verify all recurring instances were deleted
      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(
        recurringTask.googleEventId
      );
      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith(
        expect.stringContaining('recurring')
      );
    });
  });
}); 