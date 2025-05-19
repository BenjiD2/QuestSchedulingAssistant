import db from '../database/dbClient.js';

// create a new user record ------------------------------------
export async function createUser(userData) {
  return db.insert('users', { ...userData });
}

// fetch a user by ID ------------------------------------------
export async function getUserById(id) {
  const [first] = await db.select('users', { id });
  return first ?? null;
}

// overwrite the user's xp field -------------------------------
export async function updateUserXP(id, xp) {
  return db.update('users', { id }, { xp });
}

// overwrite the user's streak field ---------------------------
export async function updateUserStreak(id, streak) {
  return db.update('users', { id }, { streak });
}

// push a new achievement object onto the array ----------------
export async function addAchievement(id, achievement) {
  return db.update('users', { id }, { achievements: [achievement] });
}

// push a completed task onto the completedTasks array ---------
export async function addCompletedTask(id, task) {
  return db.update('users', { id }, { completedTasks: [task] });
}
