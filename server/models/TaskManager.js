/**
 * Manages tasks and their synchronization with Google Calendar
 */
const Task = require('./Task');

class TaskManager {
    constructor(calendarService = null) {
      this.tasks = []; 
      this.calendarService = calendarService;
    }
  
  /**
   * Adds a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Task>} Created task
   */
  async addTask(taskData) {
    try {
      // Create a new task instance
      const task = new Task(taskData);

      // Check for conflicts with existing tasks
      const hasConflict = this.tasks.some(existingTask => {
        return this.hasTimeOverlap(
          task.startTime,
          task.endTime,
          existingTask.startTime,
          existingTask.endTime
        );
      });

      if (hasConflict) {
        throw new Error('Schedule conflict detected');
      }

      // Try to sync with calendar if service is available
      if (this.calendarService) {
        try {
          const calendarEvent = await this.calendarService.addEvent(task);
          task.googleEventId = calendarEvent?.id || calendarEvent?.eventId;
        } catch (error) {
          console.log('Failed to sync with calendar:', error.message);
        }
      }

      // Add task to the list
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
      // Create a temporary task with the updates to check for conflicts
      const tempTask = {
        ...task,
        ...updates,
        startTime: updates.startTime ? new Date(updates.startTime.toISOString()) : task.startTime,
        endTime: updates.endTime ? new Date(updates.endTime.toISOString()) : task.endTime
      };

      // Validate time range
      if (tempTask.endTime <= tempTask.startTime) {
        throw new Error('End time must be after start time');
      }

      // Check for conflicts with other tasks
      const hasConflict = this.tasks.some(otherTask => {
        // Skip the task being edited
        if (otherTask.taskId === taskId) return false;

        // Check for overlap with the updated times
        const otherStart = new Date(otherTask.startTime.toISOString());
        const otherEnd = new Date(otherTask.endTime.toISOString());
        return this.hasTimeOverlap(
          tempTask.startTime,
          tempTask.endTime,
          otherStart,
          otherEnd
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
  