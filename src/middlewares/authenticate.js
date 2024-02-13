const jwt = require('jsonwebtoken');
const jwtUtils = require('../services/jwtUtils');

async function authenticate(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - Missing token' });
  }

  try {
    const decoded = jwt.verify(token, jwtUtils.getSecretKey());

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}

module.exports = authenticate;
