// In-memory store for users and tasks
const users = new Map();
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

// Helper to calculate progress to next level
const getProgressToNextLevel = (xp) => {
  const currentLevel = calculateLevel(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const currentXP = xp - xpForCurrentLevel;
  const requiredXP = xpForNextLevel - xpForCurrentLevel;
  const percentage = Math.min(Math.round((currentXP / requiredXP) * 100), 100);
  
  return { currentXP, requiredXP, percentage };
};

module.exports = {
  users,
  tasks,
  getOrCreateUser,
  getLeaderboard,
  calculateLevel,
  getProgressToNextLevel
}; 