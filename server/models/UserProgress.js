// Defines the UserProgress class.
// This class tracks a user's experience points (XP), level, streaks, and achievements.

// server/models/UserProgress.js
class UserProgress {
  constructor(userId) {
    this.userId = userId;
    this.xp = 0;
    this.streak = 0;
    this.lastActive = new Date();
    this.lastStreakUpdate = new Date();  // Track when we last updated the streak
    this.achievements = [];
    this.recentAchievements = []; // Achievements earned in current session
  }

  get level() {
    return this.calculateLevel(this.xp);
  }  

  calculateLevel(xp) {
    return Math.floor(xp / 100) + 1;
  }

  calculateProgress(xp) {
    return xp % 100;
  }

  removeXP(xpLost) {
    this.xp = Math.max(0, this.xp - xpLost);
  
    const oldLevel = this.level;
    const newLevel = this.calculateLevel(this.xp);
  
    if (newLevel < oldLevel) {
      this.achievements = this.achievements.filter(a => a.id !== `level-${oldLevel}`);
    }
  
    this.recentAchievements = [];
    this.lastActive = new Date();
  
    return {
      xp: this.xp,
      level: newLevel,
      progress: this.calculateProgress(this.xp),
      streak: this.streak,
      achievements: [],
      lastActive: this.lastActive,
      lastStreakUpdate: this.lastStreakUpdate
    };
  }

  updateStreak() {
    const now = new Date();
    const lastActiveDate = new Date(this.lastActive);
    const lastStreakDate = new Date(this.lastStreakUpdate);
    
    // Check if more than 48 hours have passed since last activity
    if ((now - lastActiveDate) > (48 * 60 * 60 * 1000)) {
      this.streak = 1; // Reset streak if inactive for 2 days
      this.lastStreakUpdate = now;
    } else {
      // Check if we're in a new day (comparing calendar dates)
      const isNewDay = now.toDateString() !== lastStreakDate.toDateString();
      
      // Check if at least 24 hours have passed since last streak update
      const is24HoursPassed = (now - lastStreakDate) > (24 * 60 * 60 * 1000);
      
      // Only update streak if it's a new day AND 24 hours have passed
      if (isNewDay && is24HoursPassed) {
        this.streak++;
        this.lastStreakUpdate = now;
        this.checkStreakAchievements();
      }
    }
    
    this.lastActive = now;
  }

  addXP(xpGained) {
    const oldLevel = this.calculateLevel(this.xp);
    this.xp += xpGained;
    const newLevel = this.calculateLevel(this.xp);
  
    // Reset session-based achievement list
    this.recentAchievements = [];
  
    // Level achievement
    if (newLevel > oldLevel) {
      const alreadyHas = this.achievements.some(a => a.id === `level-${newLevel}`);
      if (!alreadyHas) {
        const achievement = {
          id: `level-${newLevel}`,
          icon: '⭐',
          name: 'Level Up!',
          description: `Reached Level ${newLevel}`,
          date: new Date()
        };
        this.achievements.push(achievement);
        this.recentAchievements.push(achievement); // ✅ NEW
      }
    }
  
    // Update streak (may add more achievements)
    this.updateStreak();
  
    return {
      xp: this.xp,
      level: newLevel,
      progress: this.calculateProgress(this.xp),
      streak: this.streak,
      achievements: this.recentAchievements, // ✅ Only return new ones
      lastActive: this.lastActive,
      lastStreakUpdate: this.lastStreakUpdate
    };
  }  

  checkStreakAchievements() {
    const streakMilestones = [7, 30, 100];
    for (const milestone of streakMilestones) {
      if (this.streak === milestone) {
        const achievement = {
          id: `streak-${milestone}`,
          icon: '🔥',
          name: 'Streak Master',
          description: `${milestone} Day Streak!`,
          date: new Date()
        };
        this.achievements.push(achievement);
        this.recentAchievements.push(achievement); // ✅ NEW
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