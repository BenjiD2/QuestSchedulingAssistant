// server/src/routes/userRoutes.js
import express from 'express';
import {
  getUserById,
  updateUserName,
  deleteUser
} from '../services/userService.js';

const router = express.Router();

// GET /api/users/:id — fetch profile
router.get('/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) return res.sendStatus(404);
  res.json(user);
});

// PATCH /api/users/:id — update display name
router.patch('/users/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const updated = await updateUserName(req.params.id, name);
  if (!updated) return res.sendStatus(404);
  res.json(updated);
});

// DELETE /api/users/:id — delete account
router.delete('/users/:id', async (req, res) => {
  const success = await deleteUser(req.params.id);
  if (!success) return res.sendStatus(404);
  res.sendStatus(204);
});

export default router;
