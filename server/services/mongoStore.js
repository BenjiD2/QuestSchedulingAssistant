// MongoDB data store for users and tasks.
// Provides functions for MongoDB operations while maintaining compatibility with the in-memory store.

const UserModel = require('../database/models/User');
const TaskModel = require('../database/models/Task');
const UserProgressModel = require('../database/models/UserProgress');
const { connectToDatabase, getConnectionStatus } = require('../database/mongodb');
const logger = require('./logger');

/**
 * Get a user by ID from MongoDB
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
const getUser = async (userId) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    // Decode the URL-encoded userId if necessary
    const decodedUserId = decodeURIComponent(userId);
    const user = await UserModel.findOne({ userId: decodedUserId }).lean(); // Use .lean() for a plain JS object
    
    if (!user) {
      logger.mongodb.read('user', userId, false, { error: 'User not found' });
      return null;
    }

    // Get user progress
    const progress = await getOrCreateUserProgress(decodedUserId); // This already ensures progress exists and dayStreak is initialized

    if (progress) {
      user.xp = progress.xp;
      user.level = progress.level;
      user.dayStreak = progress.dayStreak;
      user.achievements = progress.achievements; // UserProgress holds the canonical list of achievements
      user.lastActivityDate = progress.lastActivityDate;
    } else {
      // Should not happen if getOrCreateUserProgress works correctly, but as a fallback:
      user.xp = user.xp || 0; // UserModel might have an old xp value
      user.level = user.level || 1;
      user.dayStreak = 0;
      // user.achievements will be whatever is on UserModel, or empty array if not present
      user.achievements = user.achievements || [];
    }

    logger.mongodb.read('user_with_progress', userId, true);
    return user; // User object now includes progress details
  } catch (error) {
    logger.mongodb.read('user', userId, false, { error: error.message });
    return null;
  }
};

/**
 * Get or create a user in MongoDB
 * @param {Object} auth0User - Auth0 user object
 * @returns {Promise<Object|null>} The user object or null
 */
const getOrCreateUser = async (auth0User) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    const userId = auth0User.sub;
    let user = await UserModel.findOne({ userId });

    if (!user) {
      logger.log('MongoDB', 'CREATE', `Creating new user ${userId}`);
      user = new UserModel({
        userId,
        name: auth0User.name || 'Anonymous User',
        email: auth0User.email
      });
      await user.save();
    } else {
      logger.mongodb.read('user', userId, true);
    }

    return user;
  } catch (error) {
    logger.log('MongoDB', 'ERROR', `Failed to get/create user`, { userId: auth0User.sub, error: error.message });
    return null;
  }
};

/**
 * Update a user in MongoDB
 * @param {string} userId - The user ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object|null>} The updated user or null
 */
const updateUser = async (userId, updates) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    // Decode the URL-encoded userId if necessary
    const decodedUserId = decodeURIComponent(userId);
    
    let user = await UserModel.findOne({ userId: decodedUserId });
    
    if (!user) {
      // Create new user if not found
      logger.log('MongoDB', 'CREATE', `Creating new user ${decodedUserId} during update`);
      user = new UserModel({
        userId: decodedUserId,
        ...updates
      });
    } else {
      // Update existing user
      logger.log('MongoDB', 'UPDATE', `Updating user ${decodedUserId}`);
      Object.keys(updates).forEach(key => {
        user[key] = updates[key];
      });
    }
    
    await user.save();
    return user;
  } catch (error) {
    logger.log('MongoDB', 'ERROR', `Failed to update user`, { userId, error: error.message });
    return null;
  }
};

/**
 * Get or create user progress in MongoDB
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The user progress or null
 */
const getOrCreateUserProgress = async (userId) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    let userProgress = await UserProgressModel.findOne({ userId });

    if (!userProgress) {
      logger.log('MongoDB', 'CREATE', `Creating new user progress for ${userId}`);
      userProgress = new UserProgressModel({ userId }); // dayStreak will default to 0
      await userProgress.save();
    } else {
      logger.mongodb.read('userProgress', userId, true);
    }

    // Ensure dayStreak is initialized if it's not present (for older documents)
    if (typeof userProgress.dayStreak === 'undefined') {
      userProgress.dayStreak = 0;
    }

    return userProgress;
  } catch (error) {
    logger.log('MongoDB', 'ERROR', `Failed to get/create user progress`, { userId, error: error.message });
    return null;
  }
};

/**
 * Update user XP in MongoDB
 * @param {string} userId - The user ID
 * @param {number} xpGained - XP to add
 * @returns {Promise<Object|null>} Updated progress or null
 */
const updateUserXP = async (userId, xpGained) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    let progress = await getOrCreateUserProgress(userId);
    
    if (!progress) {
      return null;
    }
    
    // Update XP
    progress.xp += xpGained;
    
    // Calculate new level (using the same formula as in-memory store)
    const newLevel = Math.floor(progress.xp / 100) + 1;
    
    // Check if leveled up
    const leveledUp = newLevel > progress.level;
    progress.level = newLevel;
    
    // Update last activity
    progress.lastActivityDate = new Date();

    // Calculate day streak
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of today

    const userTasks = await TaskModel.find({ userId, completed: true, completedAt: { $ne: null } }).sort({ completedAt: -1 });
    
    let currentStreak = 0;
    if (userTasks.length > 0) {
        let lastCompletionDate = null;
        const uniqueCompletionDays = new Set();

        for (const task of userTasks) {
            if (task.completedAt) {
                const completedDate = new Date(task.completedAt);
                completedDate.setHours(0, 0, 0, 0); // Normalize to start of day
                uniqueCompletionDays.add(completedDate.getTime());
            }
        }

        const sortedUniqueDays = Array.from(uniqueCompletionDays).sort((a,b) => b - a); // Most recent first

        if (sortedUniqueDays.length > 0 && sortedUniqueDays[0] === today.getTime()) {
            currentStreak = 1;
            lastCompletionDate = new Date(sortedUniqueDays[0]);

            for (let i = 1; i < sortedUniqueDays.length; i++) {
                const prevDay = new Date(lastCompletionDate);
                prevDay.setDate(prevDay.getDate() - 1);

                if (sortedUniqueDays[i] === prevDay.getTime()) {
                    currentStreak++;
                    lastCompletionDate = new Date(sortedUniqueDays[i]);
                } else {
                    break; // Streak broken
                }
            }
        } else if (sortedUniqueDays.length > 0) {
            // Check if the most recent completion was yesterday, to potentially continue a streak if today's task is the one being processed
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (sortedUniqueDays[0] === yesterday.getTime()) {
                 // This means a task completed today would make a streak of 1 (or more if yesterday was part of a streak)
                 // The current logic will correctly set it to 1 if this is the first task of today after a yesterday completion
                 // Let's assume the logic below correctly builds from today if today is the latest
            }
        }
    }
    progress.dayStreak = currentStreak;
    
    // Save progress
    await progress.save();
    
    // Update user model with new XP and level
    const user = await UserModel.findOne({ userId });
    if (user) {
      user.xp = progress.xp;
      user.level = progress.level;
      user.lastActivity = progress.lastActivityDate;
      
      // Add level-up achievement if applicable
      if (leveledUp) {
        const levelAchievement = {
          id: `level-${newLevel}`,
          title: `Reached Level ${newLevel}`,
          description: `Congratulations on reaching level ${newLevel}!`,
          icon: '🌟',
          unlockedAt: new Date()
        };
        
        user.achievements.push(levelAchievement);
        progress.achievements.push(levelAchievement);
      }
      
      await user.save();
    }
    
    logger.log('MongoDB', 'UPDATE', `Updated XP for ${userId}`, { 
      newXP: progress.xp, 
      newLevel: progress.level, 
      leveledUp 
    });
    
    return {
      userId,
      xp: progress.xp,
      level: progress.level,
      streak: progress.streak,
      dayStreak: progress.dayStreak,
      achievements: leveledUp ? [{ 
        id: `level-${newLevel}`,
        title: `Reached Level ${newLevel}`,
        description: `Congratulations on reaching level ${newLevel}!`,
        icon: '🌟'
      }] : []
    };
  } catch (error) {
    logger.log('MongoDB', 'ERROR', `Failed to update XP`, { userId, xpGained, error: error.message });
    return null;
  }
};

/**
 * Revert user XP in MongoDB
 * @param {string} userId - The user ID
 * @param {number} xpLost - XP to remove
 * @returns {Promise<Object|null>} Updated progress or null
 */
const revertUserXP = async (userId, xpLost) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    let progress = await getOrCreateUserProgress(userId);
    
    if (!progress) {
      return null;
    }
    
    // Calculate current level before XP removal
    const currentLevel = progress.level;
    
    // Update XP (ensure it doesn't go below 0)
    progress.xp = Math.max(0, progress.xp - xpLost);
    
    // Calculate new level
    const newLevel = Math.floor(progress.xp / 100) + 1;
    progress.level = newLevel;
    
    // Check if level decreased
    const levelDecreased = newLevel < currentLevel;
    
    // Update last activity
    progress.lastActivityDate = new Date();

    // Recalculate day streak (since a task was uncompleted)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTasks = await TaskModel.find({ userId, completed: true, completedAt: { $ne: null } }).sort({ completedAt: -1 });
    
    let currentStreak = 0;
    if (userTasks.length > 0) {
        let lastCompletionDate = null;
        const uniqueCompletionDays = new Set();

        for (const task of userTasks) {
            if (task.completedAt) {
                const completedDate = new Date(task.completedAt);
                completedDate.setHours(0, 0, 0, 0);
                uniqueCompletionDays.add(completedDate.getTime());
            }
        }
        
        const sortedUniqueDays = Array.from(uniqueCompletionDays).sort((a,b) => b - a);

        if (sortedUniqueDays.length > 0 && sortedUniqueDays[0] === today.getTime()) {
            currentStreak = 1;
            lastCompletionDate = new Date(sortedUniqueDays[0]);

            for (let i = 1; i < sortedUniqueDays.length; i++) {
                const prevDay = new Date(lastCompletionDate);
                prevDay.setDate(prevDay.getDate() - 1);

                if (sortedUniqueDays[i] === prevDay.getTime()) {
                    currentStreak++;
                    lastCompletionDate = new Date(sortedUniqueDays[i]);
                } else {
                    break; 
                }
            }
        } else if (sortedUniqueDays.length > 0) {
            // If the most recent task was not today, the streak is 0, unless it was yesterday.
            // If it was yesterday, and no task today, streak is still based on yesterday.
            // The logic here is simplified: if no task today, streak becomes 0 if last task wasn't yesterday.
            // This part might need refinement if un-completing a task from *today* should preserve a streak from *yesterday*.
            // For now, this recalculation is robust.
             const yesterday = new Date(today);
             yesterday.setDate(today.getDate() - 1);
             if (sortedUniqueDays.length > 0 && sortedUniqueDays[0] === yesterday.getTime()){
                // Streak ended yesterday
                currentStreak = 1; // placeholder, this will be rebuilt from yesterday
                lastCompletionDate = new Date(sortedUniqueDays[0]);
                 for (let i = 1; i < sortedUniqueDays.length; i++) {
                    const prevDay = new Date(lastCompletionDate);
                    prevDay.setDate(prevDay.getDate() - 1);

                    if (sortedUniqueDays[i] === prevDay.getTime()) {
                        currentStreak++;
                        lastCompletionDate = new Date(sortedUniqueDays[i]);
                    } else {
                        break; 
                    }
                }
             } else {
                currentStreak = 0; // If most recent wasn't today or yesterday, streak is 0
             }
        }
    }
    progress.dayStreak = currentStreak;
    
    // Save progress
    await progress.save();
    
    // Update user model
    const user = await UserModel.findOne({ userId });
    if (user) {
      user.xp = progress.xp;
      user.level = progress.level;
      user.lastActivity = progress.lastActivityDate;
      
      // Remove level achievement if level decreased
      if (levelDecreased) {
        const levelId = `level-${currentLevel}`;
        user.achievements = user.achievements.filter(a => a.id !== levelId);
      }
      
      await user.save();
    }
    
    logger.log('MongoDB', 'UPDATE', `Reverted XP for ${userId}`, { 
      newXP: progress.xp, 
      newLevel: progress.level, 
      levelDecreased 
    });
    
    return {
      userId,
      xp: progress.xp,
      level: progress.level,
      streak: progress.streak,
      dayStreak: progress.dayStreak,
    };
  } catch (error) {
    logger.log('MongoDB', 'ERROR', `Failed to revert XP`, { userId, xpLost, error: error.message });
    return null;
  }
};

/**
 * Get user achievements from MongoDB
 * @param {string} userId - The user ID
 * @returns {Promise<Array|null>} User achievements or empty array
 */
const getUserAchievements = async (userId) => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    // Decode the URL-encoded userId if necessary
    const decodedUserId = decodeURIComponent(userId);
    const user = await UserModel.findOne({ userId: decodedUserId });
    
    const achievements = user ? user.achievements : [];
    logger.mongodb.read('achievements', userId, true, { count: achievements.length });
    return achievements;
  } catch (error) {
    logger.mongodb.read('achievements', userId, false, { error: error.message });
    return [];
  }
};

/**
 * Get all tasks from MongoDB
 * @returns {Promise<Array>} All tasks
 */
const getAllTasks = async () => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    const tasks = await TaskModel.find({});
    logger.mongodb.read('tasks', null, true, { count: tasks.length });
    return tasks;
  } catch (error) {
    logger.mongodb.read('tasks', null, false, { error: error.message });
    return [];
  }
};

/**
 * Get all users for leaderboard from MongoDB
 * @returns {Promise<Array>} Users sorted by XP
 */
const getLeaderboard = async () => {
  try {
    // Ensure we're connected to MongoDB
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }

    const users = await UserModel.find({})
      .select('userId name xp level')
      .sort({ xp: -1 });
    
    logger.mongodb.read('leaderboard', null, true, { count: users.length });
    return users;
  } catch (error) {
    logger.mongodb.read('leaderboard', null, false, { error: error.message });
    return [];
  }
};

/**
 * Create a new task in MongoDB
 * @param {Object} taskData - Data for the new task
 * @returns {Promise<Object|null>} The created task or null
 */
const createTask = async (taskData) => {
  try {
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }
    // Ensure userId is present
    if (!taskData.userId) {
      logger.log('MongoDB', 'ERROR', 'Task creation failed: userId is missing', taskData);
      return null; 
    }

    // Ensure user exists
    const user = await UserModel.findOne({ userId: taskData.userId });
    if (!user) {
      logger.log('MongoDB', 'ERROR', `Task creation failed: User not found ${taskData.userId}`, taskData);
      return null;
    }

    // Generate taskId if not provided - mimicking existing logic but ensuring it's MongoDB compatible
    if (!taskData.taskId) {
      taskData.taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const newTask = new TaskModel(taskData);
    await newTask.save();
    logger.mongodb.create('task', newTask.taskId, true, { data: taskData });
    return newTask;
  } catch (error) {
    logger.mongodb.create('task', taskData.taskId || 'unknown', false, { data: taskData, error: error.message });
    return null;
  }
};

/**
 * Update a task in MongoDB
 * @param {string} taskId - The ID of the task to update
 * @param {Object} updates - The updates to apply
 * @param {string} userId - The ID of the user performing the update (for XP calculation)
 * @returns {Promise<Object|null>} The updated task or null
 */
const updateTask = async (taskId, updates, userId) => {
  try {
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }
    const task = await TaskModel.findOne({ taskId });
    if (!task) {
      logger.mongodb.update('task', taskId, false, { error: 'Task not found' });
      return null;
    }

    let xpGained = 0;
    const originalCompletionStatus = task.completed;

    // Apply updates
    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });

    // If task is marked as completed
    if (updates.completed === true && !originalCompletionStatus) {
      task.completedAt = new Date();
      // Calculate XP based on task properties
      let priorityValue = 1; // Default for 'low' or if priority is missing/undefined
      if (task.priority === 'medium') {
        priorityValue = 2;
      } else if (task.priority === 'high') {
        priorityValue = 3;
      }
      xpGained = priorityValue * 10;

      if (task.estimatedDuration) { // Changed from durationMinutes to estimatedDuration
        xpGained += Math.floor(task.estimatedDuration / 30); // Extra XP for longer tasks
      }
      task.xpValue = xpGained;

      // Update user's XP and progress
      if (userId) { // Ensure userId is available for XP update
        await updateUserXP(userId, xpGained); // This function already handles logging for XP updates
      } else {
         logger.log('MongoDB', 'WARN', `Cannot update XP for task ${taskId} completion, userId not provided.`);
      }

    } else if (updates.completed === false && originalCompletionStatus) {
      // Task is being marked as incomplete, revert XP if it had a value
      if (task.xpValue && task.xpValue > 0 && userId) {
         await revertUserXP(userId, task.xpValue); // Revert XP
      }
      task.completedAt = null;
      task.xpValue = 0;
    }

    await task.save();
    logger.mongodb.update('task', taskId, true, { updates });
    return task;
  } catch (error) {
    logger.mongodb.update('task', taskId, false, { updates, error: error.message });
    return null;
  }
};

/**
 * Delete a task from MongoDB
 * @param {string} taskId - The ID of the task to delete
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
const deleteTask = async (taskId) => {
  try {
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }
    const result = await TaskModel.deleteOne({ taskId });
    if (result.deletedCount === 0) {
      logger.mongodb.delete('task', taskId, false, { error: 'Task not found or already deleted' });
      return false;
    }
    logger.mongodb.delete('task', taskId, true);
    return true;
  } catch (error) {
    logger.mongodb.delete('task', taskId, false, { error: error.message });
    return false;
  }
};

/**
 * Get a specific task by its ID from MongoDB.
 * @param {string} taskId - The ID of the task.
 * @returns {Promise<Object|null>} The task object or null if not found.
 */
const getTaskById = async (taskId) => {
  try {
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }
    const task = await TaskModel.findOne({ taskId });
    logger.mongodb.read('task', taskId, !!task);
    return task;
  } catch (error) {
    logger.mongodb.read('task', taskId, false, { error: error.message });
    return null;
  }
};

/**
 * Delete a user and their progress from MongoDB
 * @param {string} userId - The ID of the user to delete
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
const deleteUser = async (userId) => {
  try {
    if (!getConnectionStatus()) {
      await connectToDatabase();
    }
    const decodedUserId = decodeURIComponent(userId);

    // Delete user progress first
    const progressDeletionResult = await UserProgressModel.deleteOne({ userId: decodedUserId });
    if (progressDeletionResult.deletedCount === 0) {
      logger.log('MongoDB', 'WARN', `No user progress found to delete for user ID: ${decodedUserId}. Proceeding with user deletion.`);
      // Not necessarily an error, user might not have progress. Log it and continue.
    } else {
      logger.mongodb.delete('userProgress', decodedUserId, true);
    }

    // Delete the user
    const userDeletionResult = await UserModel.deleteOne({ userId: decodedUserId });
    if (userDeletionResult.deletedCount === 0) {
      logger.mongodb.delete('user', decodedUserId, false, { error: 'User not found or already deleted' });
      return false; // User themselves not found
    }

    // Optionally: Delete user's tasks? This could be a cascading delete or kept separate.
    // For now, we are only deleting the user and their progress.
    // const taskDeletionResult = await TaskModel.deleteMany({ userId: decodedUserId });
    // logger.log('MongoDB', 'INFO', `Deleted ${taskDeletionResult.deletedCount} tasks for user ${decodedUserId}`);

    logger.mongodb.delete('user', decodedUserId, true);
    return true;
  } catch (error) {
    logger.mongodb.delete('user', decodedUserId, false, { error: error.message });
    return false;
  }
};

module.exports = {
  getUser,
  getOrCreateUser,
  updateUser,
  getOrCreateUserProgress,
  updateUserXP,
  revertUserXP,
  getUserAchievements,
  getAllTasks,
  getLeaderboard,
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  deleteUser
}; 