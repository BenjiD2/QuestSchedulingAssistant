/**
 * Integration Tests for TaskManager Service
 * Tests the interaction between TaskManager and GoogleCalendarService,
 * focusing on task updates and calendar synchronization.
 */

const TaskManager = require('../../models/TaskManager');
const Task = require('../../models/Task');
const GoogleCalendarService = require('../../models/GoogleCalendarService');
require('dotenv').config();

// Mock GoogleCalendarService
jest.mock('../../models/GoogleCalendarService', () => {
  return jest.fn().mockImplementation(() => ({
    addEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn()
  }));
});

describe('TaskManager Integration Tests', () => {
  let taskManager;
  let mockCalendarService;

  beforeEach(() => {
    // Create a mock calendar service
    mockCalendarService = {
      addEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn()
    };
    
    // Initialize TaskManager with mock service
    taskManager = new TaskManager(mockCalendarService);
  });

  describe('Task Creation', () => {
    test('should create task and sync with calendar', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        startTime: new Date('2023-12-01T10:00:00'),
        endTime: new Date('2023-12-01T11:00:00'),
        category: 'work'
      };

      // Mock successful calendar sync
      mockCalendarService.addEvent.mockResolvedValue({ id: 'calendar-event-1' });

      const task = await taskManager.addTask(taskData);

      expect(task).toMatchObject(taskData);
      expect(task.taskId).toBeDefined();
      expect(mockCalendarService.addEvent).toHaveBeenCalled();
    });

    test('should handle calendar sync failure during task creation', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        startTime: new Date('2023-12-01T10:00:00'),
        endTime: new Date('2023-12-01T11:00:00'),
        category: 'work'
      };

      // Mock calendar sync failure
      mockCalendarService.addEvent.mockRejectedValue(new Error('Calendar API Error'));

      const task = await taskManager.addTask(taskData);
      
      expect(task).toMatchObject(taskData);
      expect(task.taskId).toBeDefined();
      // Task should still be created even if calendar sync fails
      expect(mockCalendarService.addEvent).toHaveBeenCalled();
    });
  });

  describe('Update Schedule Tests', () => {
    let existingTask;

    beforeEach(async () => {
      const taskData = {
        title: 'Original Task',
        description: 'Original Description',
        startTime: new Date('2023-12-01T10:00:00'),
        endTime: new Date('2023-12-01T11:00:00'),
        category: 'work'
      };

      mockCalendarService.addEvent.mockResolvedValue({ id: 'calendar-event-1' });
      existingTask = await taskManager.addTask(taskData);
    });

    test('should successfully update task and sync with calendar', async () => {
      const updateData = {
        title: 'Updated Task',
        startTime: new Date('2023-12-01T11:00:00'),
        endTime: new Date('2023-12-01T12:00:00')
      };

      mockCalendarService.updateEvent.mockResolvedValue({ id: 'calendar-event-1' });

      const updatedTask = await taskManager.editTask(existingTask.taskId, updateData);

      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.startTime).toEqual(updateData.startTime);
      expect(updatedTask.endTime).toEqual(updateData.endTime);
      expect(mockCalendarService.updateEvent).toHaveBeenCalled();
    });

    test('should handle calendar sync failure gracefully', async () => {
      const updateData = {
        title: 'Updated Task'
      };

      mockCalendarService.updateEvent.mockRejectedValue(new Error('Calendar API Error'));

      const updatedTask = await taskManager.editTask(existingTask.taskId, updateData);

      expect(updatedTask.title).toBe(updateData.title);
      // Task should still be updated even if calendar sync fails
      expect(mockCalendarService.updateEvent).toHaveBeenCalled();
    });
  });

  describe('Task Deletion', () => {
    let existingTask;

    beforeEach(async () => {
      const taskData = {
        title: 'Task to Delete',
        description: 'Will be deleted',
        startTime: new Date('2023-12-01T10:00:00'),
        endTime: new Date('2023-12-01T11:00:00'),
        category: 'work'
      };

      mockCalendarService.addEvent.mockResolvedValue({ id: 'calendar-event-1' });
      existingTask = await taskManager.addTask(taskData);
    });

    test('should delete task and calendar event', async () => {
      mockCalendarService.deleteEvent.mockResolvedValue({});

      await taskManager.deleteTask(existingTask.taskId);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalled();
      // Verify task is removed from internal storage
      await expect(taskManager.getTask(existingTask.taskId)).rejects.toThrow();
    });

    test('should handle calendar deletion failure', async () => {
      mockCalendarService.deleteEvent.mockRejectedValue(new Error('Calendar API Error'));

      await taskManager.deleteTask(existingTask.taskId);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalled();
      // Task should still be deleted even if calendar sync fails
      await expect(taskManager.getTask(existingTask.taskId)).rejects.toThrow();
    });
  });
});
