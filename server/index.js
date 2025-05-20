// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const GoogleCalendarService = require('./models/GoogleCalendarService');
const TaskManager = require('./models/TaskManager');
const googleConfig = require('./config/google');
const userRoutes = require('./routes/userRoutes');
const store = require('./services/store');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

    // Update progress using the new system
    const updatedProgress = revert
      ? store.revertUserXP(userId, xpGained)
      : store.updateUserXP(userId, xpGained);
    
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

app.post('/api/users/xp', (req, res) => {
  const { userId, xpGained, revert } = req.body;

  const progress = userMap.get(userId) || new UserProgress(userId);

  const result = revert
    ? progress.removeXP(xpGained) // ⬅️ new method
    : progress.addXP(xpGained);

  userMap.set(userId, progress);
  res.json(result);
});


// Add routes
app.use('/api', userRoutes);
app.use('/api', require('./routes/timeEstimation'));

// Task endpoints
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
    const tasks = await taskManager.getAllTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
app.get('/api/users/:userId/achievements', (req, res) => {
  try {
    const { userId } = req.params;
    const achievements = store.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Update user information
app.put('/api/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Validate updates
    if (!updates.name || !updates.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Try to update or create user
    const updatedUser = store.updateUser(userId, updates);
    console.log('Updated user:', updatedUser.toJSON());
    res.json(updatedUser.toJSON());
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message,
      userId
    });
  }
});

// Get user information
app.get('/api/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = store.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.toJSON());
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  // Start the server only if this file is run directly
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; // Export the app instance for testing
