// Server-side API routes for user management.
// This file defines endpoints for fetching, updating, and deleting user information.

const express = require('express');
const store = require('../services/store'); // In-memory store (retained for now)
const mongoStore = require('../services/mongoStore'); // MongoDB store
const logger = require('../services/logger'); // Logger

const router = express.Router();

// NEW: POST /api/users/sync - Synchronize Auth0 user with MongoDB
router.post('/users/sync', async (req, res) => {
  const auth0User = req.body; // Expects the Auth0 user object in the request body

  if (!auth0User || !auth0User.sub) {
    logger.log('API_ERROR', 'USER_SYNC', 'Auth0 user data (sub) is required for sync.', { body: req.body });
    return res.status(400).json({ error: 'Auth0 user data (sub) is required.' });
  }

  try {
    logger.log('API_CALL', 'USER_SYNC', `Attempting to sync user: ${auth0User.sub}`);
    const user = await mongoStore.getOrCreateUser(auth0User);

    if (!user) {
      logger.log('API_ERROR', 'USER_SYNC', `Failed to get or create user in MongoDB: ${auth0User.sub}`);
      return res.status(500).json({ error: 'Failed to synchronize user with database.' });
    }

    logger.log('API_SUCCESS', 'USER_SYNC', `User synced successfully: ${user.userId}`, { mongoUserId: user._id });
    res.status(200).json(user); // Send back the MongoDB user object
  } catch (error) {
    logger.log('API_ERROR', 'USER_SYNC', `Error during user sync for ${auth0User.sub}: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error during user synchronization.', details: error.message });
  }
});

// GET /api/users/:id — fetch profile from MongoDB
router.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  logger.log('API_CALL', 'GET_USER', `Attempting to fetch user by ID: ${userId}`);
  try {
    const user = await mongoStore.getUser(userId);
    if (!user) {
      logger.log('API_INFO', 'GET_USER', `User not found in MongoDB: ${userId}`);
      // Optionally, you could check the in-memory store as a fallback if desired during transition
      // const inMemoryUser = store.users.get(userId);
      // if (inMemoryUser) { ... }
      return res.status(404).json({ error: 'User not found' });
    }
    logger.log('API_SUCCESS', 'GET_USER', `User fetched successfully from MongoDB: ${userId}`);
    res.json(user);
  } catch (error) {
    logger.log('API_ERROR', 'GET_USER', `Error fetching user ${userId}: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error fetching user.', details: error.message });
  }
});

// PATCH /api/users/:id — update display name (currently uses in-memory, will be updated)
router.patch('/users/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  // This needs to be updated to use mongoStore.updateUser similar to the GET route
  const user = store.users.get(req.params.id);
  if (!user) return res.sendStatus(404);
  
  user.name = name;
  store.users.set(req.params.id, user);
  res.json(user);
});

// DELETE /api/users/:id — delete account (currently uses in-memory, will be updated)
router.delete('/users/:id', async (req, res) => {
  // This needs to be updated to use mongoStore for deletion
  if (!store.users.has(req.params.id)) return res.sendStatus(404);
  store.users.delete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
