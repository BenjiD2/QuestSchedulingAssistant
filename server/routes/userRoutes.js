// server/src/routes/userRoutes.js
const express = require('express');
const store = require('../services/store');

const router = express.Router();

// GET /api/users/:id — fetch profile
router.get('/users/:id', async (req, res) => {
  const user = store.users.get(req.params.id);
  if (!user) return res.sendStatus(404);
  res.json(user);
});

// PATCH /api/users/:id — update display name
router.patch('/users/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  const user = store.users.get(req.params.id);
  if (!user) return res.sendStatus(404);
  
  user.name = name;
  store.users.set(req.params.id, user);
  res.json(user);
});

// DELETE /api/users/:id — delete account
router.delete('/users/:id', async (req, res) => {
  if (!store.users.has(req.params.id)) return res.sendStatus(404);
  store.users.delete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
