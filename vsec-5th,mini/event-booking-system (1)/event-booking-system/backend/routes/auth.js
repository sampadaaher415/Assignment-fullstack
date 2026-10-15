const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');
const { publicUser, isEmail } = require('../utils/helpers');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name) return res.status(400).json({ error: 'Enter your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) {
    return res.status(400).json({ error: 'Use a password with at least 8 characters.' });
  }

  const user = {
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'user',
    createdAt: new Date(),
  };

  try {
    const result = await getDB().collection('users').insertOne(user);
    user._id = result.insertedId;
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
    }
    throw err;
  }

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const user = await getDB().collection('users').findOne({ email });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Email or password is incorrect.' });

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

module.exports = router;
