const express = require('express');
const router = express.Router();
const SonarClient = require('../config/sonarClient');
const SonarTimeEstimator = require('../services/SonarTimeEstimator');

const sonarClient = new SonarClient();
const timeEstimator = new SonarTimeEstimator(sonarClient);

router.post('/estimate-time', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const estimate = await timeEstimator.estimateTime(description);
    res.json(estimate);
  } catch (error) {
    console.error('Time estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate time' });
  }
});

module.exports = router; 