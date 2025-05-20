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
// const store = require('./services/store'); // In-memory store removed
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
      // This case should ideally not be hit if connectToDatabase handles its errors and doesn't resolve true/false
      console.log('⚠️ Warning: MongoDB connection failed. The application might not work as expected.');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB initial connection error:', err);
    // Depending on the app's requirements, you might want to exit here if DB is critical
    console.log('⚠️ MongoDB connection failed. The application might not work as expected.');
  });

// Initialize services (GoogleCalendarService and TaskManager might still use in-memory store or be legacy)
// Review TaskManager and GoogleCalendarService if they directly interact with 'store' for user/task data.
// For now, their initialization is kept as is, assuming their core logic is independent of user/task persistence layer we just migrated.
let calendarService = null;
let taskManager = null;

try {
  calendarService = new GoogleCalendarService(googleConfig);
  taskManager = new TaskManager(calendarService); // TaskManager might need review if it uses 'store'
} catch (error) {
  console.log('Google Calendar service not initialized:', error.message);
  taskManager = new TaskManager(null); // TaskManager might need review
}

// Routes
app.get('/', (req, res) => {
  res.send('Quest Scheduling Assistant API');
});

// XP update endpoint - Now fully uses MongoDB
app.post('/api/users/xp', async (req, res) => {
  logger.log('API_CALL', 'UPDATE_XP', 'Received XP update request', req.body);
  try {
    const { userId, xpGained, revert } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      logger.log('API_ERROR', 'UPDATE_XP', 'Invalid userId', { userId });
      return res.status(400).json({ error: 'Invalid userId: must be a non-empty string' });
    }

    if (typeof xpGained !== 'number' || isNaN(xpGained) || xpGained < 0) {
      logger.log('API_ERROR', 'UPDATE_XP', 'Invalid xpGained', { xpGained });
      return res.status(400).json({ error: 'Invalid xpGained: must be a non-negative number' });
    }

    let updatedProgress;
    if (revert) {
      logger.log('API_INFO', 'UPDATE_XP', `Attempting to revert ${xpGained} XP for user ${userId} via MongoDB.`);
      updatedProgress = await mongoStore.revertUserXP(userId, xpGained);
    } else {
      logger.log('API_INFO', 'UPDATE_XP', `Attempting to grant ${xpGained} XP to user ${userId} via MongoDB.`);
      updatedProgress = await mongoStore.updateUserXP(userId, xpGained);
    }
    
    if (!updatedProgress) {
      // mongoStore functions already log errors internally
      logger.log('API_ERROR', 'UPDATE_XP', `Failed to update/revert XP for user ${userId} in MongoDB.`);
      return res.status(500).json({ error: 'Failed to update XP in database.' });
    }

    logger.log('API_SUCCESS', 'UPDATE_XP', `XP for user ${userId} ${revert ? 'reverted' : 'updated'} successfully via MongoDB.`, updatedProgress);
    res.json(updatedProgress);
    
  } catch (error) {
    // This catch block might be redundant if mongoStore functions handle their errors and don't throw up to here,
    // or if they throw specific errors we want to handle differently.
    logger.log('API_ERROR', 'UPDATE_XP', 'Unexpected error during XP update.', { message: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ 
      error: 'Failed to update XP due to an unexpected server error.',
      details: error.message
    });
  }
});

// Add routes
app.use('/api', userRoutes);
app.use('/api', taskRoutes);
app.use('/api', require('./routes/timeEstimation'));

// Task endpoints (These are now handled by taskRoutes.js, so they remain commented out)
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

// Calendar events endpoint (Assumed independent of user/task data store for now)
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

// Get user achievements - Now relies solely on mongoStore, and primarily user data is fetched via /api/users/:id
app.get('/api/users/:userId/achievements', async (req, res) => {
  const { userId } = req.params;
  logger.log('API_CALL', 'GET_ACHIEVEMENTS', `Attempting to retrieve achievements for user ${userId} from MongoDB.`);
  try {
    // mongoStore.getUser already populates achievements from UserProgress.
    // This dedicated endpoint might be redundant if client always fetches full user data.
    // However, if called directly, it should use mongoStore.getUserAchievements or mongoStore.getUser.
    // For consistency and to ensure we get the latest, let's use mongoStore.getUserAchievements.
    
    const achievements = await mongoStore.getUserAchievements(userId);
    
    if (!achievements) {
        // This case implies an error within mongoStore.getUserAchievements or user not found for achievements.
        logger.log('API_ERROR', 'GET_ACHIEVEMENTS', `Could not retrieve achievements for user ${userId} from MongoDB, or user has no UserModel.`);
        return res.status(404).json({ error: 'Achievements not found or user does not exist.'});
    }
    
    logger.log('API_SUCCESS', 'GET_ACHIEVEMENTS', `Retrieved ${achievements.length} achievements for user ${userId} from MongoDB.`);
    res.json(achievements);

  } catch (error) {
    logger.log('API_ERROR', 'GET_ACHIEVEMENTS', `Error fetching achievements for ${userId}: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error fetching achievements.', details: error.message });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  logger.log('API_CALL', 'GET_LEADERBOARD', 'Attempting to fetch leaderboard from MongoDB.');
  try {
    const leaderboard = await mongoStore.getLeaderboard();
    if (!leaderboard) {
      logger.log('API_ERROR', 'GET_LEADERBOARD', 'Failed to fetch leaderboard from MongoDB.');
      return res.status(500).json({ error: 'Failed to fetch leaderboard.' });
    }
    logger.log('API_SUCCESS', 'GET_LEADERBOARD', `Leaderboard fetched successfully with ${leaderboard.length} users.`);
    res.json(leaderboard);
  } catch (error) {
    logger.log('API_ERROR', 'GET_LEADERBOARD', `Error fetching leaderboard: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error fetching leaderboard.', details: error.message });
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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    // console.log(`💾 In-memory database is still being used as fallback`); // Old message
  } else {
    // console.log('Production mode: In-memory store usage should be minimal or disabled.');
  }
});

module.exports = app; // For testing purposes
