const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { sequelize } = require('../config/database');

const router = express.Router();

// GET /tasks - Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    console.log('Getting all tasks...');
    const tasks = await Task.findAll({
      order: [['startTime', 'ASC']]
    });
    console.log('Retrieved tasks from database:', tasks);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to get tasks' });
  }
});

// POST /tasks - Create a new task
router.post('/tasks', async (req, res) => {
  let transaction = null;
  
  try {
    console.log('Creating new task with data:', req.body);
    
    const taskData = {
      ...req.body,
      userId: req.body.userId || req.user?.sub // Get userId from request or auth
    };

    if (!taskData.userId) {
      console.error('Missing userId in task creation');
      return res.status(400).json({ error: 'userId is required' });
    }

    // Start transaction for task creation
    transaction = await sequelize.transaction();

    // First verify user exists within transaction
    const user = await User.findOne({ 
      where: { userId: taskData.userId },
      transaction
    });
    
    if (!user) {
      console.error('User not found:', taskData.userId);
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    if (!taskData.title || !taskData.startTime || !taskData.endTime) {
      console.error('Missing required fields:', { taskData });
      await transaction.rollback();
      return res.status(400).json({ error: 'title, startTime, and endTime are required' });
    }

    // Generate taskId if not provided
    if (!taskData.taskId) {
      taskData.taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    console.log('Creating task with validated data:', taskData);
    const task = await Task.create(taskData, { transaction });
    console.log('Task created successfully:', task.toJSON());

    await transaction.commit();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    console.error('Error stack:', error.stack);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update a task
router.put('/tasks/:id', async (req, res) => {
  let transaction = null;
  
  try {
    console.log('Updating task:', req.params.id, 'with data:', req.body);
    
    transaction = await sequelize.transaction();
    
    // First find the task with transaction
    const task = await Task.findByPk(req.params.id, { transaction });
    
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Task not found' });
    }

    // Calculate XP if task is being completed
    let xpGained = 0;
    if (req.body.completed && !task.completed) {
      xpGained = task.calculateXP();
      
      // Update task with completion data
      await task.update({
        completed: true,
        completedAt: new Date(),
        xpValue: xpGained
      }, { transaction });

      // Update user progress
      await UserProgress.increment(
        { xp: xpGained },
        { 
          where: { userId: task.userId },
          transaction
        }
      );
    } else if (req.body.completed === false) {
      // If task is being uncompleted
      await task.update({
        completed: false,
        completedAt: null,
        xpValue: 0
      }, { transaction });
    } else {
      // For non-completion updates
      const updateData = {
        ...req.body,
        // Preserve existing values that shouldn't be overwritten
        taskId: task.taskId,
        userId: task.userId,
        completed: task.completed,
        completedAt: task.completedAt,
        xpValue: task.xpValue
      };
      await task.update(updateData, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch updated task
    const updatedTask = await Task.findByPk(req.params.id);
    console.log('Task updated successfully:', updatedTask.toJSON());
    res.json(updatedTask);

  } catch (error) {
    console.error('Error updating task:', error);
    console.error('Error stack:', error.stack);
    if (transaction) await transaction.rollback();
    res.status(400).json({ error: error.message || 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete a task
router.delete('/tasks/:id', async (req, res) => {
  let transaction = null;
  
  try {
    console.log('Deleting task:', req.params.id);
    
    transaction = await sequelize.transaction();
    
    const task = await Task.findOne({ 
      where: { taskId: req.params.id },
      transaction
    });
    
    if (!task) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.destroy({ transaction });
    
    await transaction.commit();
    console.log('Task deleted successfully');
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting task:', error);
    console.error('Error stack:', error.stack);
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

module.exports = router; 