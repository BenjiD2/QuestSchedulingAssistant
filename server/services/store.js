const UserProgress = require('../models/UserProgress');
const User = require('../models/User');

// In-memory store for users and tasks
const users = new Map();
const userProgress = new Map();
const tasks = new Map();

// Helper to get or create user
const getOrCreateUser = (auth0User) => {
  const userId = auth0User.sub;
  if (!users.has(userId)) {
    const newUser = new User({
      userId,
      name: auth0User.name || 'Anonymous User',
      email: auth0User.email
    });
    users.set(userId, newUser);
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

// Update user information
const updateUser = (userId, updates) => {
  // Decode the URL-encoded userId if necessary
  const decodedUserId = decodeURIComponent(userId);
  const user = users.get(decodedUserId);
  
  if (!user) {
    // If user doesn't exist, create a new one
    const newUser = new User({
      userId: decodedUserId,
      ...updates
    });
    users.set(decodedUserId, newUser);
    return newUser;
  }
  
  user.update(updates);
  return user;
};

// Get user by ID
const getUser = (userId) => {
  // Decode the URL-encoded userId if necessary
  const decodedUserId = decodeURIComponent(userId);
  return users.get(decodedUserId);
};

// Update the XP update function
const updateUserXP = (userId, xpGained) => {
  const progress = getOrCreateUserProgress(userId);
  const updatedProgress = progress.addXP(xpGained);
  
  // Update user with new XP and level
  const user = users.get(userId);
  if (user) {
    user.update({
      xp: updatedProgress.xp,
      level: updatedProgress.level,
      streak: updatedProgress.streak
    });

    // Add any new achievements to the user
    if (updatedProgress.achievements?.length > 0) {
      updatedProgress.achievements.forEach(achievement => {
        user.addAchievement(achievement);
      });
    }
  }
  
  // Save to store
  userProgress.set(userId, progress);
  
  return updatedProgress;
};

// Helper to get all users sorted by XP
const getLeaderboard = () => {
  return Array.from(users.values())
    .map(user => user.toJSON())
    .sort((a, b) => b.xp - a.xp);
};

// Helper to calculate level from XP
const calculateLevel = (xp) => {
  return Math.floor(xp / 100) + 1;
};

// Helper to get progress to next level
const getProgressToNextLevel = (xp) => {
  return xp % 100;
};

// Get user achievements
const getUserAchievements = (userId) => {
  // Decode the URL-encoded userId if necessary
  const decodedUserId = decodeURIComponent(userId);
  const user = users.get(decodedUserId);
  return user ? user.achievements : [];
};

module.exports = {
  users,
  tasks,
  userProgress,
  getOrCreateUser,
  getUser,
  updateUser,
  getLeaderboard,
  getOrCreateUserProgress,
  updateUserXP,
  calculateLevel,
  getProgressToNextLevel,
  getUserAchievements
}; 