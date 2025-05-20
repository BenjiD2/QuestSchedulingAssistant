/**
 * Manages tasks and their synchronization with Google Calendar
 */
const Task = require('./Task');
const crypto = require('crypto');

class TaskManager {
    constructor(calendarService = null) {
      this.calendarService = calendarService;
      this.tasks = [];
    }
  
  /**
   * Adds a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Task>} Created task
   */
  validateTask(taskData, excludeTaskId = null) {
    // Check required fields
    if (!taskData.title) {
      throw new Error('Missing required fields');
    }

    // Validate dates if provided
    if (taskData.startTime || taskData.endTime) {
      if (!(taskData.startTime instanceof Date) || !(taskData.endTime instanceof Date)) {
        throw new Error('Invalid date format');
      }

      if (taskData.endTime <= taskData.startTime) {
        throw new Error('End time must be after start time');
      }

      // Check for schedule conflicts, excluding the task being updated
      const hasConflict = this.tasks.some(existingTask => {
        // Skip the task being edited
        if (excludeTaskId && existingTask.taskId === excludeTaskId) {
          return false;
        }

        if (!existingTask.startTime || !existingTask.endTime) {
          return false;
        }

        return (
          (taskData.startTime >= existingTask.startTime && taskData.startTime < existingTask.endTime) ||
          (taskData.endTime > existingTask.startTime && taskData.endTime <= existingTask.endTime) ||
          (taskData.startTime <= existingTask.startTime && taskData.endTime >= existingTask.endTime)
        );
      });

      if (hasConflict) {
        throw new Error('Schedule conflict detected');
      }
    }
  }

  async addTask(taskData) {
    try {
      // Validate task data
      this.validateTask(taskData);

      // Create task
      const task = {
        ...taskData,
        taskId: crypto.randomUUID(),
        completed: false
      };

      // Try to sync with calendar if service is available
      if (this.calendarService) {
        try {
          const calendarEvent = await this.calendarService.addEvent(task);
          if (calendarEvent && calendarEvent.id) {
            task.googleEventId = calendarEvent.id;
          }
        } catch (error) {
          console.error('Failed to sync with calendar:', error);
          // Continue without calendar sync
        }
      }

      this.tasks.push(task);
      return task;
    } catch (error) {
      throw error;
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
    return (ts1 < te2 && te1 > ts2);
  }

  /**
   * Edits an existing task
   * @param {string} taskId - ID of task to edit
   * @param {Object} updates - Task updates
   * @returns {Promise<Task>} Updated task
   */
  async editTask(taskId, updates) {
    try {
      const taskIndex = this.tasks.findIndex(t => t.taskId === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask = { ...this.tasks[taskIndex], ...updates };
      
      // Validate the updated task, excluding itself from conflict check
      this.validateTask(updatedTask, taskId);

      // Try to sync with calendar if service is available
      if (this.calendarService && updatedTask.googleEventId) {
        try {
          await this.calendarService.updateEvent(updatedTask);
        } catch (error) {
          console.error('Failed to sync with calendar:', error);
          // Continue without calendar sync
        }
      }

      this.tasks[taskIndex] = updatedTask;
      return updatedTask;
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
      const taskIndex = this.tasks.findIndex(t => t.taskId === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = this.tasks[taskIndex];

      // Try to delete from calendar if service is available
      if (this.calendarService && task.googleEventId) {
        try {
          await this.calendarService.deleteEvent(task.googleEventId);
        } catch (error) {
          console.error('Failed to delete from calendar:', error);
          // Continue with local deletion
        }
      }

      this.tasks.splice(taskIndex, 1);
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

  async getTask(taskId) {
    const task = this.tasks.find(t => t.taskId === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }
}

module.exports = TaskManager;
  