class User {
  constructor({
    userId,
    name,
    email,
    xp = 0,
    level = 1,
    completedTasks = [],
    achievements = []
  }) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.xp = xp;
    this.level = level;
    this.completedTasks = completedTasks;
    this.achievements = achievements;
  }

  addXP(amount) {
    this.xp += amount;
    this.checkLevelUp();
  }

  checkLevelUp() {
    // XP required for next level = current level * 100
    const nextLevelXP = this.level * 100;
    
    while (this.xp >= nextLevelXP) {
      this.level += 1;
      this.xp -= nextLevelXP;
      this.onLevelUp();
    }
  }

  onLevelUp() {
    // Add any level-up rewards or achievements
    this.achievements.push({
      type: 'LEVEL_UP',
      level: this.level,
      timestamp: new Date()
    });
  }

  completeTask(task) {
    const xpGained = task.calculateXP();
    this.addXP(xpGained);
    
    this.completedTasks.push({
      taskId: task.taskId,
      completedAt: new Date(),
      xpGained
    });

    // Check for task-related achievements
    this.checkTaskAchievements();
  }

  checkTaskAchievements() {
    const today = new Date();
    const todayTasks = this.completedTasks.filter(task => 
      task.completedAt.toDateString() === today.toDateString()
    );

    // Achievement: Complete 5 tasks in a day
    if (todayTasks.length === 5) {
      this.achievements.push({
        type: 'DAILY_WARRIOR',
        timestamp: new Date(),
        description: 'Completed 5 tasks in one day'
      });
    }

    // Achievement: Complete tasks 7 days in a row
    const last7Days = new Array(7).fill().map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });

    const hasStreak = last7Days.every(date => 
      this.completedTasks.some(task => 
        task.completedAt.toDateString() === date
      )
    );

    if (hasStreak) {
      this.achievements.push({
        type: 'WEEKLY_STREAK',
        timestamp: new Date(),
        description: '7-day completion streak'
      });
    }
  }

  getProgressToNextLevel() {
    const nextLevelXP = this.level * 100;
    return {
      currentXP: this.xp,
      requiredXP: nextLevelXP,
      percentage: (this.xp / nextLevelXP) * 100
    };
  }
}

module.exports = User; 