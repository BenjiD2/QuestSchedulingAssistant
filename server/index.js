// Main server entry file.
// Sets up the Express application, middleware, and defines core API endpoints.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const GoogleCalendarService = require('./models/GoogleCalendarService');
const TaskManager = require('./models/TaskManager');
const googleConfig = require('./config/google');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const store = require('./services/store');
const mongoStore = require('./services/mongoStore');
const { connectToDatabase } = require('./database/mongodb');
const logger = require('./services/logger');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize MongoDB connection
connectToDatabase()
  .then(connected => {
    if (connected) {
      console.log('✅ MongoDB connected successfully');
      console.log('📊 User and Task data operations are now primarily using MongoDB.');
    } else {
      console.log('⚠️ Warning: MongoDB connection failed, falling back to in-memory database for some operations');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️ Falling back to in-memory database for some operations');
  });

// Initialize services
let calendarService = null;
let taskManager = null;

try {
  calendarService = new GoogleCalendarService(googleConfig);
  taskManager = new TaskManager(calendarService);
} catch (error) {
  console.log('Google Calendar service not initialized:', error.message);
  taskManager = new TaskManager(null);
}

// Routes
app.get('/', (req, res) => {
  res.send('Quest Scheduling Assistant API');
});

// XP update endpoint
app.post('/api/users/xp', async (req, res) => {
  try {
    console.log('Received XP update request:', req.body);
    const { userId, xpGained, revert } = req.body;
    
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      console.log('Invalid userId:', userId);
      return res.status(400).json({ error: 'Invalid userId: must be a non-empty string' });
    }

    if (typeof xpGained !== 'number' || isNaN(xpGained) || xpGained < 0) {
      console.log('Invalid xpGained:', xpGained);
      return res.status(400).json({ error: 'Invalid xpGained: must be a positive number' });
    }

    // Update progress using the in-memory system
    const updatedProgress = revert
      ? store.revertUserXP(userId, xpGained)
      : store.updateUserXP(userId, xpGained);
    
    logger.log('In-Memory', 'UPDATE', `${revert ? 'Reverted' : 'Updated'} XP for user ${userId}`, {
      xpChange: revert ? -xpGained : xpGained,
      newXP: updatedProgress.xp,
      newLevel: updatedProgress.level
    });
    
    // Also update in MongoDB (but don't wait for it)
    if (revert) {
      mongoStore.revertUserXP(userId, xpGained)
        .then(result => {
          if (result) {
            console.log('MongoDB XP revert succeeded:', {
              userId,
              xpLost: xpGained,
              newXP: result.xp,
              newLevel: result.level
            });
          }
        })
        .catch(err => {
          console.error('MongoDB XP revert error:', err);
        });
    } else {
      mongoStore.updateUserXP(userId, xpGained)
        .then(result => {
          if (result) {
            console.log('MongoDB XP update succeeded:', {
              userId,
              xpGained,
              newXP: result.xp,
              newLevel: result.level,
              achievements: result.achievements
            });
          }
        })
        .catch(err => {
          console.error('MongoDB XP update error:', err);
        });
    }
    
    console.log('Updated progress:', updatedProgress);
    res.json(updatedProgress);
    
  } catch (error) {
    console.error('XP update error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update XP',
      details: error.message,
      userId: req.body?.userId
    });
  }
});

// Add routes
app.use('/api', userRoutes);
app.use('/api', taskRoutes);
app.use('/api', require('./routes/timeEstimation'));

// Task endpoints (These are now handled by taskRoutes.js, so we comment them out)
/*
app.post('/tasks', async (req, res) => {
  try {
    const task = await taskManager.addTask(req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/tasks/:taskId', async (req, res) => {
  try {
    const task = await taskManager.editTask(req.params.taskId, req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/tasks/:taskId', async (req, res) => {
  try {
    await taskManager.deleteTask(req.params.taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/tasks', async (req, res) => {
  try {
    console.log('📚 Attempting to retrieve tasks from MongoDB...');
    // First try to get tasks from MongoDB
    const mongoTasks = await mongoStore.getAllTasks();
    console.log(`📊 Retrieved ${mongoTasks.length} tasks from MongoDB`);
    
    // If MongoDB returns tasks, use them, otherwise fall back to in-memory
    let tasks;
    if (mongoTasks.length > 0) {
      tasks = mongoTasks;
      console.log('✅ Using tasks from MongoDB');
    } else {
      tasks = await taskManager.getAllTasks();
      logger.inMemory.fallback('tasks', null, { count: tasks.length });
      console.log(`⚠️ Falling back to in-memory tasks (${tasks.length} tasks)`);
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error getting tasks:', error);
    // Fall back to in-memory tasks
    try {
      const tasks = await taskManager.getAllTasks();
      logger.inMemory.fallback('tasks', null, { count: tasks.length });
      console.log(`⚠️ Falling back to in-memory tasks (${tasks.length} tasks)`);
      res.json(tasks);
    } catch (fallbackError) {
      res.status(500).json({ error: fallbackError.message });
    }
  }
});
*/

// Calendar events endpoint
app.get('/calendar/events', async (req, res) => {
  try {
    if (!calendarService) {
      return res.status(503).json({ error: 'Google Calendar service not available' });
    }

    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    const events = await calendarService.fetchEvents(token);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user achievements
app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📚 Attempting to retrieve achievements for user ${userId} from MongoDB...`);
    
    // First try to get achievements from MongoDB
    const mongoAchievements = await mongoStore.getUserAchievements(userId);
    console.log(`📊 Retrieved ${mongoAchievements.length} achievements from MongoDB for user ${userId}`);
    
    // If MongoDB returns achievements, use them, otherwise fall back to in-memory
    let achievements;
    if (mongoAchievements.length > 0) {
      achievements = mongoAchievements;
      console.log('✅ Using achievements from MongoDB');
    } else {
      achievements = store.getUserAchievements(userId);
      logger.inMemory.fallback('achievements', userId, { count: achievements.length });
      console.log(`⚠️ Falling back to in-memory achievements (${achievements.length} achievements)`);
    }
    
    res.json(achievements);
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    // Fall back to in-memory achievements
    try {
      const achievements = store.getUserAchievements(userId);
      logger.inMemory.fallback('achievements', userId, { count: achievements.length });
      console.log(`⚠️ Falling back to in-memory achievements (${achievements.length} achievements)`);
      res.json(achievements);
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  }
});

// Update user information
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Validate updates
    if (!updates.name || !updates.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Update in memory store
    const updatedUser = store.updateUser(userId, updates);
    logger.log('In-Memory', 'UPDATE', `Updated user ${userId}`, updates);
    
    // Also update in MongoDB (but don't wait for it)
    mongoStore.updateUser(userId, updates)
      .then(result => {
        if (result) {
          console.log('✅ MongoDB user update succeeded:', {
            userId,
            name: result.name,
            email: result.email
          });
        }
      })
      .catch(err => {
        console.error('❌ MongoDB user update error:', err);
      });
    
    console.log('Updated user:', updatedUser.toJSON());
    res.json(updatedUser.toJSON());
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message,
      userId: req.params.userId
    });
  }
});

// Get user information
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📚 Attempting to retrieve user ${userId} from MongoDB...`);
    
    // First try to get user from MongoDB
    const mongoUser = await mongoStore.getUser(userId);
    console.log(`User from MongoDB for ${userId}: ${mongoUser ? '✅ found' : '⚠️ not found'}`);
    
    // If MongoDB returns a user, use it, otherwise fall back to in-memory
    if (mongoUser) {
      console.log('✅ Using user from MongoDB:', {
        userId: mongoUser.userId,
        name: mongoUser.name,
        level: mongoUser.level,
        xp: mongoUser.xp
      });
      res.json(mongoUser);
    } else {
      const user = store.getUser(userId);
      
      if (!user) {
        console.log(`⚠️ User ${userId} not found in either database`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      logger.inMemory.fallback('user', userId);
      console.log(`⚠️ Falling back to in-memory user: ${user.name}`);
      res.json(user.toJSON());
    }
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    // Fall back to in-memory user
    try {
      const user = store.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      logger.inMemory.fallback('user', userId);
      console.log(`⚠️ Falling back to in-memory user: ${user.name}`);
      res.json(user.toJSON());
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
});

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  // Start the server only if this file is run directly
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 MongoDB integration is active (read-only for now)`);
    console.log(`💾 In-memory database is still being used as fallback`);
  });
}

module.exports = app; // Export the app instance for testing
