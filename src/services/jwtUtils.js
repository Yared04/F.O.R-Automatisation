const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function generateToken(user) {
  const payload = {
    userId: user.id,
    userName: user.userName,
    roleId: user.roleId,
  };

  const options = {
    expiresIn: '1h',
  };

  return jwt.sign(payload, jwtSecret, options);
}

module.exports = {
  generateToken,
};
