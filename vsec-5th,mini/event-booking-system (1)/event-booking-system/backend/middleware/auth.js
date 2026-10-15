const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { toObjectId } = require('../utils/helpers');

const DEV_SECRET = 'dev-only-insecure-secret';

function secret() {
  return process.env.JWT_SECRET || DEV_SECRET;
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, secret(), { expiresIn: '7d' });
}

// Verifies the Bearer token and loads the user fresh from the DB,
// so role changes and deleted accounts take effect immediately.
async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Log in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Log in again.' });
  }

  const userId = toObjectId(payload.sub);
  const user = userId && (await getDB().collection('users').findOne({ _id: userId }));
  if (!user) return res.status(401).json({ error: 'Account not found. Log in again.' });

  req.user = { id: String(user._id), _id: user._id, name: user.name, email: user.email, role: user.role };
  next();
}

function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can do this.' });
    }
    next();
  });
}

module.exports = { signToken, requireAuth, requireAdmin, DEV_SECRET };
