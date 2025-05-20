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
    const { userId, xpGained } = req.body;
    
    // Strict input validation
    if (!userId || typeof userId !== 'string') {
      console.log('Invalid userId:', userId);
      return res.status(400).json({ error: 'Invalid userId: must be a non-empty string' });
    }

    if (typeof xpGained !== 'number' || isNaN(xpGained) || xpGained < 0) {
      console.log('Invalid xpGained:', xpGained);
      return res.status(400).json({ error: 'Invalid xpGained: must be a positive number' });
    }

    // Initialize user if they don't exist
    if (!store.users.has(userId)) {
      console.log('Creating new user:', userId);
      store.users.set(userId, {
        id: userId,
        name: 'Anonymous User',
        xp: 0,
        level: 1,
        streak: 0,
        achievements: []
      });
    }

    // Get user and update XP
    const user = store.users.get(userId);
    if (!user) {
      console.error('Failed to get/create user:', userId);
      return res.status(500).json({ error: 'Failed to get/create user' });
    }

    console.log('Current user data:', user);

    // Ensure XP is a number and has a default value
    const oldXp = typeof user.xp === 'number' ? user.xp : 0;
    const newXp = oldXp + xpGained;

    // Update user data
    const updatedUser = {
      ...user,
      xp: newXp,
      level: store.calculateLevel(newXp)
    };

    // Save updated user
    store.users.set(userId, updatedUser);

    const response = {
      id: updatedUser.id,
      xp: updatedUser.xp,
      level: updatedUser.level,
      streak: updatedUser.streak,
      progress: store.getProgressToNextLevel(updatedUser.xp)
    };

    console.log('Updated user data:', response);
    res.json(response);
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
