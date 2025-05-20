// Defines the User class.
// This class represents user data and includes methods for updating user properties, managing completed tasks and achievements.

class User {
  constructor(userData) {
    this.userId = userData.userId;
    this.name = userData.name || 'Anonymous User';
    this.email = userData.email;
    this.xp = userData.xp || 0;
    this.level = userData.level || 1;
    this.streak = userData.streak || 0;
    this.completedTasks = userData.completedTasks || [];
    this.achievements = userData.achievements || [];
    this.lastActive = userData.lastActive || new Date();
    this.lastStreakUpdate = userData.lastStreakUpdate || new Date();
  }

  update(updates) {
    Object.assign(this, updates);
    return this;
  }

  addCompletedTask(task) {
    this.completedTasks.push({
      ...task,
      completedAt: new Date()
    });
  }

  addAchievement(achievement) {
    this.achievements.push({
      ...achievement,
      date: new Date()
    });
  }

  toJSON() {
    return {
      userId: this.userId,
      name: this.name,
      email: this.email,
      xp: this.xp,
      level: this.level,
      streak: this.streak,
      completedTasks: this.completedTasks,
      achievements: this.achievements,
      lastActive: this.lastActive,
      lastStreakUpdate: this.lastStreakUpdate
    };
  }
}

module.exports = User;
