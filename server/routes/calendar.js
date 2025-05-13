const express = require('express');
const router = express.Router();
const GoogleCalendarService = require('../models/GoogleCalendarService');
const googleConfig = require('../config/google');

const calendarService = new GoogleCalendarService(googleConfig);

// POST /auth/google
router.post('/auth', async (req, res) => {
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

// GET /calendar/events
router.get('/events', async (req, res) => {
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

module.exports = router;
