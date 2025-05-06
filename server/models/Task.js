/**
 * Task Model
 * Represents a task with validation and update functionality
 */
class Task {
  constructor(taskData) {
    this.taskId = taskData.taskId || `task_${Date.now()}`;
    this.title = taskData.title;
    this.description = taskData.description;
    this.startTime = this.parseDate(taskData.startTime);
    this.endTime = this.parseDate(taskData.endTime);
    this.location = taskData.location;
    this.category = taskData.category || 'default';
    this.completed = taskData.completed || false;
    this.duration = taskData.duration;
    this.xpValue = taskData.xpValue || 0;
    this.recurrence = taskData.recurrence;
    this.googleEventId = taskData.googleEventId;
    this.isRecurringInstance = taskData.isRecurringInstance || false;
    this.originalTaskId = taskData.originalTaskId;

    this.validate();
  }

  /**
   * Helper method to parse dates consistently
   * @private
   */
  parseDate(date) {
    if (!date) return null;
    
    let timestamp;
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      // If the date is already in UTC (has 'Z' suffix), use it as is
      if (date.toISOString().endsWith('Z')) {
        return new Date(date.getTime());
      }
      // Convert to UTC by removing any timezone offset
      timestamp = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
      );
    } else {
      // For string dates, first create a temporary date
      const tempDate = new Date(date);
      if (isNaN(tempDate.getTime())) {
        throw new Error('Invalid date format');
      }
      // If the string date is already in UTC (has 'Z' suffix), use it as is
      if (date.toString().endsWith('Z')) {
        return new Date(tempDate.getTime());
      }
      // Then convert to UTC
      timestamp = Date.UTC(
        tempDate.getUTCFullYear(),
        tempDate.getUTCMonth(),
        tempDate.getUTCDate(),
        tempDate.getUTCHours(),
        tempDate.getUTCMinutes(),
        tempDate.getUTCSeconds(),
        tempDate.getUTCMilliseconds()
      );
    }
    return new Date(timestamp);
  }

  validate() {
    // Check required fields
    if (!this.title || !this.startTime || !this.endTime) {
      throw new Error('Missing required fields');
    }

    // Validate date objects
    if (!(this.startTime instanceof Date) || !(this.endTime instanceof Date)) {
      throw new Error('Invalid date format');
    }

    // Check for invalid dates
    if (isNaN(this.startTime.getTime()) || isNaN(this.endTime.getTime())) {
      throw new Error('Invalid date format');
    }

    // Validate time range
    if (this.endTime <= this.startTime) {
      throw new Error('End time must be after start time');
    }
  }

  update(updates) {
    // Create a temporary object with the updates
    const tempUpdates = { ...updates };

    // Parse dates if provided
    if (updates.startTime) {
      tempUpdates.startTime = this.parseDate(updates.startTime);
    }
    if (updates.endTime) {
      tempUpdates.endTime = this.parseDate(updates.endTime);
    }

    // Validate time range if both times are provided
    if (tempUpdates.startTime && tempUpdates.endTime) {
      if (tempUpdates.endTime <= tempUpdates.startTime) {
        throw new Error('End time must be after start time');
      }
    }

    // Apply updates
    Object.assign(this, tempUpdates);

    // Validate the updated task
    this.validate();
  }

  toCalendarEvent() {
    return {
      summary: this.title,
      description: this.description,
      location: this.location,
      start: {
        dateTime: this.startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: this.endTime.toISOString(),
        timeZone: 'UTC'
      },
      recurrence: this.recurrence ? [this.recurrence] : undefined
    };
  }

  /**
   * Calculates XP value for task completion
   * @returns {number} XP value
   */
  calculateXP() {
    // Base XP calculation based on duration and complexity
    let baseXP = this.duration / 30 * 10; // 10 XP per 30 minutes
    
    // Bonus XP for different categories
    const categoryBonus = {
      work: 1.5,
      study: 1.3,
      exercise: 1.4,
      default: 1.0
    };

    return Math.round(baseXP * (categoryBonus[this.category] || 1.0));
  }
}

module.exports = Task; 