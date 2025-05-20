// server/models/UserProgress.js
class UserProgress {
  constructor(userId) {
    this.userId = userId;
    this.xp = 0;
    this.level = 1;
    this.streak = 0;
    this.lastActive = new Date();
    this.lastStreakUpdate = new Date();  // Track when we last updated the streak
    this.achievements = [];
    this.recentAchievements = []; // Achievements earned in current session
  }

  calculateLevel(xp) {
    return Math.floor(xp / 100) + 1;
  }

  calculateProgress(xp) {
    return xp % 100;
  }

  updateStreak() {
    const now = new Date();
    const lastActiveDate = new Date(this.lastActive);
    const lastStreakDate = new Date(this.lastStreakUpdate);
    
    // Check if we're in a new day (comparing calendar dates)
    const isNewDay = now.toDateString() !== lastStreakDate.toDateString();
    
    if (isNewDay) {
      // If more than 48 hours have passed since last activity, reset streak
      const hoursSinceLastActive = (now - lastActiveDate) / (1000 * 60 * 60);
      if (hoursSinceLastActive > 48) {
        console.log('Streak reset: More than 48 hours since last activity');
        this.streak = 1;
      } else {
        // If within 48 hours and it's a new day, increment streak
        this.streak++;
        console.log('Streak increased to:', this.streak);
        this.checkStreakAchievements();
      }
      // Update the last streak update time
      this.lastStreakUpdate = now;
    }
    
    // Always update lastActive
    this.lastActive = now;
  }

  addXP(xpGained) {
    const oldLevel = this.level;
    this.xp += xpGained;
    this.level = this.calculateLevel(this.xp);
    
    // Check for level-up
    if (this.level > oldLevel) {
      this.achievements.push({
        id: `level-${this.level}`,
        icon: '⭐',
        name: 'Level Up!',
        description: `Reached Level ${this.level}`,
        date: new Date()
      });
    }

    this.updateStreak();
    return {
      xp: this.xp,
      level: this.level,
      progress: this.calculateProgress(this.xp),
      streak: this.streak,
      achievements: this.getRecentAchievements(),
      lastActive: this.lastActive,
      lastStreakUpdate: this.lastStreakUpdate
    };
  }

  checkStreakAchievements() {
    const streakMilestones = [7, 30, 100];
    for (const milestone of streakMilestones) {
      if (this.streak === milestone) {
        this.achievements.push({
          id: `streak-${milestone}`,
          icon: '🔥',
          name: 'Streak Master',
          description: `${milestone} Day Streak!`,
          date: new Date()
        });
      }
    }
  }

  getRecentAchievements() {
    // Get achievements from the last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.achievements.filter(a => new Date(a.date) > cutoff);
  }
}

module.exports = UserProgress; 