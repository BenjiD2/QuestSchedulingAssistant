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
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of TaskManager for each test
    taskManager = new TaskManager();
    
    // Get the mocked calendar service instance
    mockCalendarService = taskManager.calendarService;
  });

  describe('Task Creation', () => {
    it('should create task and sync with calendar', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        startTime: new Date('2024-03-20T10:00:00'),
        endTime: new Date('2024-03-20T11:00:00'),
        priority: 'high',
        status: 'pending'
      };

      // Mock successful calendar sync
      mockCalendarService.addEvent.mockResolvedValue({ id: 'calendar-event-1' });

      const task = await taskManager.addTask(taskData);

      expect(task).toBeInstanceOf(Task);
      expect(task.title).toBe(taskData.title);
      expect(mockCalendarService.addEvent).toHaveBeenCalled();
    });

    it('should handle calendar sync failure during task creation', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        startTime: new Date('2024-03-20T10:00:00'),
        endTime: new Date('2024-03-20T11:00:00'),
        priority: 'high',
        status: 'pending'
      };

      // Mock calendar sync failure
      mockCalendarService.addEvent.mockRejectedValue(new Error('Calendar API Error'));

      await expect(taskManager.addTask(taskData))
        .rejects
        .toThrow('Failed to add task: Calendar API Error');
    });
  });

  describe('Update Schedule Tests', () => {
    let existingTask;

    beforeEach(async () => {
      // Create a task before each update test
      const taskData = {
        title: 'Original Task',
        description: 'Original Description',
        startTime: new Date('2024-03-20T10:00:00'),
        endTime: new Date('2024-03-20T11:00:00'),
        priority: 'high',
        status: 'pending'
      };

      mockCalendarService.addEvent.mockResolvedValue({ id: 'calendar-event-1' });
      existingTask = await taskManager.addTask(taskData);
    });

    it('should successfully update task and sync with calendar', async () => {
      const updates = {
        title: 'Updated Task',
        startTime: new Date('2024-03-20T14:00:00'),
        endTime: new Date('2024-03-20T15:00:00')
      };

      // Mock successful calendar update
      mockCalendarService.updateEvent.mockResolvedValue({ id: 'calendar-event-1' });

      const updatedTask = await taskManager.editTask(existingTask.taskId, updates);

      expect(updatedTask.title).toBe(updates.title);
      expect(mockCalendarService.updateEvent).toHaveBeenCalled();
    });

    it('should handle calendar sync failure gracefully', async () => {
      const updates = {
        title: 'Updated Task',
        startTime: new Date('2024-03-20T14:00:00'),
        endTime: new Date('2024-03-20T15:00:00')
      };

      // Mock calendar sync failure
      mockCalendarService.updateEvent.mockRejectedValue(new Error('Calendar API Error'));

      await expect(taskManager.editTask(existingTask.taskId, updates))
        .rejects
        .toThrow('Failed to sync task with calendar');
    });

    it('should detect schedule conflicts', async () => {
      // Create initial task
      const task = await taskManager.addTask({
        title: 'Original Task',
        description: 'Original Description',
        startTime: new Date('2024-03-20T21:00:00Z'),
        endTime: new Date('2024-03-20T22:00:00Z')
      });

      // Create another task that doesn't initially conflict
      const otherTask = await taskManager.addTask({
        title: 'Other Task',
        description: 'Other Description',
        startTime: new Date('2024-03-20T22:00:00Z'),
        endTime: new Date('2024-03-20T23:00:00Z')
      });

      // Try to update the second task to overlap with the first
      const updates = {
        startTime: new Date('2024-03-20T21:30:00Z'),
        endTime: new Date('2024-03-20T22:30:00Z')
      };

      // Verify conflict detection
      await expect(taskManager.editTask(otherTask.taskId, updates))
        .rejects
        .toThrow('Schedule conflict detected');

      // Verify task remains unchanged
      const tasks = await taskManager.getAllTasks();
      const unchangedTask = tasks.find(t => t.taskId === otherTask.taskId);
      expect(unchangedTask.startTime.getTime()).toBe(new Date('2024-03-20T22:00:00Z').getTime());
      expect(unchangedTask.endTime.getTime()).toBe(new Date('2024-03-20T23:00:00Z').getTime());
    });
  });

  describe('Task Deletion', () => {
    let existingTask;

    beforeEach(async () => {
      // Create a task before each deletion test
      const taskData = {
        title: 'Task to Delete',
        description: 'Will be deleted',
        startTime: new Date('2024-03-20T10:00:00'),
        endTime: new Date('2024-03-20T11:00:00'),
        priority: 'high',
        status: 'pending'
      };

      mockCalendarService.addEvent.mockResolvedValue({ id: 'calendar-event-1' });
      existingTask = await taskManager.addTask(taskData);
    });

    it('should delete task and calendar event', async () => {
      // Mock successful calendar deletion
      mockCalendarService.deleteEvent.mockResolvedValue();

      await taskManager.deleteTask(existingTask.taskId);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalled();
      expect(taskManager.tasks.find(t => t.taskId === existingTask.taskId)).toBeUndefined();
    });

    it('should handle calendar deletion failure', async () => {
      // Mock calendar deletion failure
      mockCalendarService.deleteEvent.mockRejectedValue(new Error('Calendar API Error'));

      await expect(taskManager.deleteTask(existingTask.taskId))
        .rejects
        .toThrow('Failed to delete task: Calendar API Error');
    });
  });
});
