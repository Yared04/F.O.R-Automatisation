const jwt = require('jsonwebtoken');
const jwtUtils = require('../services/jwtUtils');

async function authenticate(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - Missing token' });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized - Invalid Authorization header format' });
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
