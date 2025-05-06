require('dotenv').config();
const express = require('express');
const cors = require('cors');
const GoogleCalendarService = require('./models/GoogleCalendarService');
const TaskManager = require('./models/TaskManager');
const googleConfig = require('./config/google');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const calendarService = new GoogleCalendarService(googleConfig);
const taskManager = new TaskManager(calendarService);

// Routes
app.get('/', (req, res) => {
  res.send('Quest Scheduling Assistant API');
});

// Google Calendar authentication endpoint
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    calendarService.setAccessToken(token);
    res.json({ message: 'Successfully authenticated with Google Calendar' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
