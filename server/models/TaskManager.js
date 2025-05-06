/**
 * Manages tasks and their synchronization with Google Calendar
 */
const Task = require('./Task');
const GoogleCalendarService = require('./GoogleCalendarService');

class TaskManager {
  constructor() {
    this.tasks = [];
    this.calendarService = new GoogleCalendarService();
  }
  
  /**
   * Adds a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Task>} Created task
   */
  async addTask(taskData) {
    try {
      // Create and validate task
      const task = new Task(taskData);

      // Check for schedule conflicts before adding
      const hasConflict = this.tasks.some(existingTask => 
        this.hasTimeOverlap(
          task.startTime,
          task.endTime,
          existingTask.startTime,
          existingTask.endTime
        )
      );

      if (hasConflict) {
        throw new Error('Schedule conflict detected');
      }

      // Sync with calendar
      const calendarEvent = await this.calendarService.addEvent(task);
      task.googleEventId = calendarEvent.id;

      // Add to local storage
      this.tasks.push(task);

      return task;
    } catch (error) {
      throw new Error(`Failed to add task: ${error.message}`);
    }
  }

  /**
   * Helper method to expand recurring tasks into individual instances
   * @private
   */
  expandRecurringTasks(tasks) {
    const expandedTasks = [];
    for (const task of tasks) {
      if (task.recurrence) {
        // For recurring tasks, create instances based on recurrence pattern
        const instances = this.generateRecurringInstances(task);
        expandedTasks.push(...instances);
      } else {
        expandedTasks.push(task);
      }
    }
    return expandedTasks;
  }

  /**
   * Helper method to generate instances of a recurring task
   * @private
   */
  generateRecurringInstances(task) {
    const instances = [];
    const recurrencePattern = task.recurrence;
    
    // Parse recurrence pattern (e.g., "FREQ=WEEKLY;COUNT=4")
    const freq = recurrencePattern.match(/FREQ=(\w+)/)?.[1];
    const count = parseInt(recurrencePattern.match(/COUNT=(\d+)/)?.[1] || '1');
    
    let currentDate = new Date(task.startTime);
    const endDate = new Date(task.endTime);
    const duration = endDate - currentDate;
    
    for (let i = 0; i < count; i++) {
      const instance = new Task({
        ...task,
        taskId: `${task.taskId}_${i}`,
        startTime: new Date(currentDate),
        endTime: new Date(currentDate.getTime() + duration),
        isRecurringInstance: true,
        originalTaskId: task.taskId
      });
      instances.push(instance);
      
      // Increment date based on frequency
      switch (freq) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return instances;
  }
  
  /**
   * Gets all tasks, expanding recurring tasks into individual instances
   * @returns {Promise<Array<Task>>} List of tasks
   */
  async getAllTasks() {
    return this.expandRecurringTasks([...this.tasks]);
  }
  
  /**
   * Checks if two time ranges overlap
   * @private
   */
  hasTimeOverlap(start1, end1, start2, end2) {
    if (!start1 || !end1 || !start2 || !end2) {
      return false;
    }

    // Convert to timestamps for comparison
    const ts1 = start1.getTime();
    const te1 = end1.getTime();
    const ts2 = start2.getTime();
    const te2 = end2.getTime();

    // Two ranges overlap if:
    // 1. Start of range1 is before end of range2 AND
    // 2. End of range1 is after start of range2
    // Note: Tasks can start exactly when another task ends (no overlap)
    return (ts1 < te2 && te1 > ts2);
  }

  /**
   * Edits an existing task
   * @param {string} taskId - ID of task to edit
   * @param {Object} updates - Task updates
   * @returns {Promise<Task>} Updated task
   */
  async editTask(taskId, updates) {
    // Find the task first
    const task = this.tasks.find(t => t.taskId === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    try {
      // Create a new task instance with the updates
      const updatedTaskData = {
        ...task,
        ...updates,
        // Ensure dates are properly handled
        startTime: updates.startTime ? new Date(updates.startTime) : task.startTime,
        endTime: updates.endTime ? new Date(updates.endTime) : task.endTime
      };

      // Create a new Task instance to validate the updates
      const tempTask = new Task(updatedTaskData);

      // Check for conflicts with other tasks
      const hasConflict = this.tasks.some(otherTask => {
        // Skip the task being edited
        if (otherTask.taskId === taskId) return false;

        // Check for overlap with the updated times
        return this.hasTimeOverlap(
          tempTask.startTime,
          tempTask.endTime,
          otherTask.startTime,
          otherTask.endTime
        );
      });

      if (hasConflict) {
        throw new Error('Schedule conflict detected');
      }

      // Try to sync with calendar
      let calendarEvent;
      try {
        if (task.googleEventId) {
          calendarEvent = await this.calendarService.updateEvent({
            ...tempTask,
            googleEventId: task.googleEventId
          });
        } else {
          calendarEvent = await this.calendarService.addEvent(tempTask);
        }

        // Update the task with calendar event ID and other updates
        Object.assign(task, {
          ...tempTask,
          googleEventId: calendarEvent?.id || calendarEvent?.eventId || task.googleEventId
        });

        return task;
      } catch (error) {
        throw new Error('Failed to sync task with calendar');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a task and its calendar events
   * @param {string} taskId - ID of task to delete
   * @returns {Promise<void>}
   */
  async deleteTask(taskId) {
    try {
      const task = this.tasks.find(t => t.taskId === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      try {
        // Delete recurring event first if it exists
        if (task.recurrence) {
          await this.calendarService.deleteEvent(`recurring_${task.googleEventId}`);
        }

        // Delete the main calendar event
        await this.calendarService.deleteEvent(task.googleEventId);

        // Remove task from local storage
        this.tasks = this.tasks.filter(t => t.taskId !== taskId);

        // Remove any recurring instances
        this.tasks = this.tasks.filter(t => t.originalTaskId !== taskId);
      } catch (error) {
        throw new Error(`Failed to delete task: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the entire schedule for conflicts
   * @returns {Promise<boolean>} True if schedule is valid
   */
  async validateSchedule() {
    const sortedTasks = [...this.tasks].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const current = sortedTasks[i];
      const next = sortedTasks[i + 1];
      
      if (this.hasTimeOverlap(current.startTime, current.endTime, next.startTime, next.endTime)) {
        throw new Error('Schedule conflict detected');
      }
    }
    
    return true;
  }
}

module.exports = TaskManager;
  