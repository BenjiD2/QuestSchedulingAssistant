const express = require('express');
// Remove Sequelize models and config
// const Task = require('../models/Task'); 
// const User = require('../models/User');
// const UserProgress = require('../models/UserProgress');
// const { sequelize } = require('../config/database');

// Import mongoStore functions
const mongoStore = require('../services/mongoStore');
const logger = require('../services/logger'); // Assuming logger is used or can be

const router = express.Router();

// GET /tasks - Get all tasks from MongoDB
router.get('/tasks', async (req, res) => {
  try {
    logger.log('Route: /tasks', 'GET', 'Attempting to get all tasks from MongoDB');
    const tasks = await mongoStore.getAllTasks();
    if (tasks) {
      logger.log('Route: /tasks', 'GET', 'Successfully retrieved tasks from MongoDB', { count: tasks.length });
      res.json(tasks);
    } else {
      logger.log('Route: /tasks', 'GET', 'Failed to retrieve tasks from MongoDB / No tasks found');
      res.status(500).json({ error: 'Failed to get tasks or no tasks available' });
    }
  } catch (error) {
    logger.log('Route: /tasks', 'GET', 'Error getting tasks from MongoDB', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message || 'Failed to get tasks' });
  }
});

// POST /tasks - Create a new task in MongoDB
router.post('/tasks', async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.body.userId || (req.user ? req.user.sub : null) // Get userId from request or auth
    };

    logger.log('Route: /tasks', 'POST', 'Attempting to create new task in MongoDB', { initialData: req.body, derivedUserId: taskData.userId });

    if (!taskData.userId) {
      logger.log('Route: /tasks', 'POST', 'Task creation failed: userId is required', { taskData });
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!taskData.title || !taskData.startTime || !taskData.endTime) {
      logger.log('Route: /tasks', 'POST', 'Task creation failed: title, startTime, and endTime are required', { taskData });
      return res.status(400).json({ error: 'title, startTime, and endTime are required' });
    }

    const task = await mongoStore.createTask(taskData);

    if (task) {
      logger.log('Route: /tasks', 'POST', 'Task created successfully in MongoDB', { task });
      res.status(201).json(task);
    } else {
      // createTask in mongoStore already logs specific errors, so we can be more general here
      // It also checks for user existence, so a 404 might be relevant if user not found
      logger.log('Route: /tasks', 'POST', 'Task creation failed in MongoDB (mongoStore.createTask returned null)');
      // Check if user not found error was the cause (based on mongoStore.createTask logic)
      // This is a bit of an assumption, ideally mongoStore would return a more specific error object
      const userExists = await mongoStore.getUser(taskData.userId);
      if(!userExists){
        return res.status(404).json({ error: 'User not found, cannot create task' });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  } catch (error) {
    logger.log('Route: /tasks', 'POST', 'Error creating task in MongoDB', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update a task in MongoDB
router.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    let userIdForXp = req.user ? req.user.sub : null;
    let taskOwnerId = null;

    // Fetch the existing task first to get its owner and ensure it exists
    const existingTask = await mongoStore.getTaskById(taskId);
    if (!existingTask) {
        logger.log('Route: /tasks/:id', 'PUT', `Task ${taskId} not found, cannot update.`, { taskId });
        return res.status(404).json({ error: 'Task not found' });
    }
    taskOwnerId = existingTask.userId;

    // Determine the userId to be used for XP updates.
    // Prefer the authenticated user if available, otherwise use the task owner.
    // This also handles the case where an admin might be completing a task for a user.
    if (userIdForXp) {
        logger.log('Route: /tasks/:id', 'PUT', `Authenticated user ID ${userIdForXp} will be used for potential XP update for task ${taskId}.`);
    } else {
        userIdForXp = taskOwnerId;
        logger.log('Route: /tasks/:id', 'PUT', `Task owner ID ${taskOwnerId} will be used for potential XP update for task ${taskId} as no authenticated user ID was found in req.user.sub.`);
    }

    // If completing/uncompleting a task, ensure userIdForXp is present for XP processing.
    if (typeof updates.completed === 'boolean' && !userIdForXp) {
        // This case should ideally not be hit if taskOwnerId is always retrieved and used as fallback.
        logger.log('Route: /tasks/:id', 'PUT', `Critical: Cannot process XP for task ${taskId} completion/uncompletion: userIdForXp is missing.`, { taskId });
        // Decide if the update should proceed without XP, or error out.
        // For now, we let mongoStore.updateTask handle its internal logging if userId is missing for XP part.
    }

    logger.log('Route: /tasks/:id', 'PUT', `Attempting to update task ${taskId} in MongoDB`, { taskId, updates, userIdForXpToUseInMongoStore: userIdForXp });

    const updatedTask = await mongoStore.updateTask(taskId, updates, userIdForXp); // Pass the determined userIdForXp

    if (updatedTask) {
      logger.log('Route: /tasks/:id', 'PUT', `Task ${taskId} updated successfully in MongoDB`, { updatedTask });
      res.json(updatedTask);
    } else {
      // updateTask in mongoStore logs specific errors. A 404 is common if task not found.
      logger.log('Route: /tasks/:id', 'PUT', `Task ${taskId} update failed in MongoDB (mongoStore.updateTask returned null). Checking if task exists.`);
      // To provide a more specific error, check if the task exists.
      // This might involve adding a simple getTaskById to mongoStore or checking the return of updateTask differently.
      // For now, if null, it could be not found or another update error.
      const checkTask = await mongoStore.getTaskById(taskId); // Assumes getTaskById exists or will be added
      if (!checkTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(400).json({ error: 'Failed to update task' }); 
    }
  } catch (error) {
    logger.log('Route: /tasks/:id', 'PUT', `Error updating task ${taskId} in MongoDB`, { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message || 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete a task from MongoDB
router.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    logger.log('Route: /tasks/:id', 'DELETE', `Attempting to delete task ${taskId} from MongoDB`, { taskId });

    const success = await mongoStore.deleteTask(taskId);

    if (success) {
      logger.log('Route: /tasks/:id', 'DELETE', `Task ${taskId} deleted successfully from MongoDB`);
      res.sendStatus(204);
    } else {
      // deleteTask in mongoStore logs specific errors. 404 if not found.
      logger.log('Route: /tasks/:id', 'DELETE', `Task ${taskId} deletion failed in MongoDB (mongoStore.deleteTask returned false).`);
      // To provide a more specific error, we assume if false, it was not found, as per mongoStore.deleteTask logic
      res.status(404).json({ error: 'Task not found or failed to delete' });
    }
  } catch (error) {
    logger.log('Route: /tasks/:id', 'DELETE', `Error deleting task ${taskId} from MongoDB`, { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

module.exports = router; 