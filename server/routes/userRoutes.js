// Server-side API routes for user management.
// This file defines endpoints for fetching, updating, and deleting user information.

const express = require('express');
// const store = require('../services/store'); // In-memory store - No longer needed here
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
      return res.status(404).json({ error: 'User not found' });
    }
    logger.log('API_SUCCESS', 'GET_USER', `User fetched successfully from MongoDB: ${userId}`, { user }); // Log the fetched user
    res.json(user);
  } catch (error) {
    logger.log('API_ERROR', 'GET_USER', `Error fetching user ${userId}: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error fetching user.', details: error.message });
  }
});

// PATCH /api/users/:id — update user data in MongoDB
router.patch('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;

  // Basic validation: ensure there are updates to apply
  if (Object.keys(updates).length === 0) {
    logger.log('API_ERROR', 'UPDATE_USER', `No updates provided for user ${userId}.`, { body: req.body });
    return res.status(400).json({ error: 'No updates provided.' });
  }
  // Example: if only name is updatable for now via this route
  // if (!updates.name) return res.status(400).json({ error: 'name is required for update' });

  logger.log('API_CALL', 'UPDATE_USER', `Attempting to update user ${userId} in MongoDB.`, { userId, updates });
  try {
    const updatedUser = await mongoStore.updateUser(userId, updates);
    if (!updatedUser) {
      logger.log('API_ERROR', 'UPDATE_USER', `User ${userId} not found or update failed in MongoDB.`);
      return res.status(404).json({ error: 'User not found or update failed.' });
    }
    logger.log('API_SUCCESS', 'UPDATE_USER', `User ${userId} updated successfully in MongoDB.`, { updatedUser });
    res.json(updatedUser);
  } catch (error) {
    logger.log('API_ERROR', 'UPDATE_USER', `Error updating user ${userId}: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error updating user.', details: error.message });
  }
});

// DELETE /api/users/:id — delete account from MongoDB
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;
  logger.log('API_CALL', 'DELETE_USER', `Attempting to delete user ${userId} from MongoDB.`);
  try {
    const success = await mongoStore.deleteUser(userId);
    if (!success) {
      // deleteUser in mongoStore logs if user or progress not found
      logger.log('API_ERROR', 'DELETE_USER', `User ${userId} not found or deletion failed in MongoDB.`);
      return res.status(404).json({ error: 'User not found or deletion failed.' });
    }
    logger.log('API_SUCCESS', 'DELETE_USER', `User ${userId} and their progress deleted successfully from MongoDB.`);
    res.sendStatus(204); // Successfully deleted, no content to return
  } catch (error) {
    logger.log('API_ERROR', 'DELETE_USER', `Error deleting user ${userId}: ${error.message}`, { error });
    res.status(500).json({ error: 'Internal server error deleting user.', details: error.message });
  }
});

module.exports = router;
