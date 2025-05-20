// server/src/services/userService.js

const User = require('../models/User');

/**
 * createUser: creates a new user document in MongoDB
 */
async function createUser(userData) {
  return User.create(userData);
}

/**
 * getUserById: finds a user by their userId (no .exec so mocks can return directly)
 */
async function getUserById(id) {
  return User.findOne({ userId: id });
}

/**
 * updateUserName: changes the user's display name
 */
async function updateUserName(id, name) {
  return User.findOneAndUpdate(
    { userId: id },
    { name },
    { new: true }
  );
}

/**
 * deleteUser: removes a user account
 */
async function deleteUser(id) {
  const res = await User.deleteOne({ userId: id });
  return res.deletedCount === 1;
}

/**
 * updateUserXP: sets the user's xp to a new value, then saves & returns user
 */
async function updateUserXP(id, xp) {
  const user = await getUserById(id);
  if (!user) return null;
  user.xp = xp;
  await user.save();
  return user;
}

/**
 * updateUserStreak: sets the user's streak to a new value, then saves & returns user
 */
async function updateUserStreak(id, streak) {
  const user = await getUserById(id);
  if (!user) return null;
  user.streak = streak;
  await user.save();
  return user;
}

/**
 * addAchievement: appends an achievement object and returns updated user
 */
async function addAchievement(id, achievement) {
  const user = await getUserById(id);
  if (!user) return null;
  user.achievements.push(achievement);
  await user.save();
  return user;
}

/**
 * addCompletedTask: appends a completedTask record and returns updated user
 */
async function addCompletedTask(id, task) {
  const user = await getUserById(id);
  if (!user) return null;
  user.completedTasks.push(task);
  await user.save();
  return user;
}

module.exports = {
  createUser,
  getUserById,
  updateUserName,
  deleteUser,
  updateUserXP,
  updateUserStreak,
  addAchievement,
  addCompletedTask
};
