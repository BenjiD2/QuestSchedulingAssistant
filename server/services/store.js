const UserProgress = require('../models/UserProgress');

// In-memory store for users and tasks
const users = new Map();
const userProgress = new Map();
const tasks = new Map();

// Helper to get or create user
const getOrCreateUser = (auth0User) => {
  const userId = auth0User.sub;
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      name: auth0User.name || 'Anonymous User',
      email: auth0User.email,
      xp: 0,
      level: 1,
      streak: 0,
      achievements: []
    });
  }
  return users.get(userId);
};

// Helper to get or create user progress
const getOrCreateUserProgress = (userId) => {
  if (!userProgress.has(userId)) {
    userProgress.set(userId, new UserProgress(userId));
  }
  return userProgress.get(userId);
};

// Update the XP update function
const updateUserXP = (userId, xpGained) => {
  const progress = getOrCreateUserProgress(userId);
  const updatedProgress = progress.addXP(xpGained);
  
  // Save to store
  userProgress.set(userId, progress);
  
  return updatedProgress;
};

// Helper to get all users sorted by XP
const getLeaderboard = () => {
  return Array.from(users.values())
    .sort((a, b) => b.xp - a.xp)
    .map(user => ({
      id: user.id,
      name: user.name,
      xp: user.xp,
      level: user.level,
      streak: user.streak
    }));
};

// Helper to calculate level from XP
const calculateLevel = (xp) => {
  return Math.floor(xp / 100) + 1;
};

// Helper to get progress to next level
const getProgressToNextLevel = (xp) => {
  return xp % 100;
};

module.exports = {
  users,
  tasks,
  userProgress,
  getOrCreateUser,
  getLeaderboard,
  getOrCreateUserProgress,
  updateUserXP,
  calculateLevel,
  getProgressToNextLevel
}; 