class Task {
  constructor({
    taskId,
    title,
    description,
    startTime,
    endTime,
    duration, // in minutes
    location,
    recurrence,
    completed = false,
    googleEventId = '',
    xpValue = 0, // XP value for completing the task
    category = 'default'
  }) {
    this.taskId = taskId || crypto.randomUUID();
    this.title = title;
    this.description = description;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
    this.location = location;
    this.recurrence = recurrence;
    this.completed = completed;
    this.googleEventId = googleEventId;
    this.xpValue = xpValue;
    this.category = category;
  }

  update(updates) {
    // Validate required fields
    if (updates.title === '') {
      throw new Error('Title is required');
    }

    if (updates.startTime && updates.endTime) {
      if (updates.endTime < updates.startTime) {
        throw new Error('End time cannot be before start time');
      }
    }

    if (updates.duration && updates.duration <= 0) {
      throw new Error('Duration must be greater than 0 minutes');
    }

    // Update properties
    Object.assign(this, updates);
  }

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