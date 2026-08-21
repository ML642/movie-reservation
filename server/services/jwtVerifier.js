const jwt = require('jsonwebtoken');

const verify = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured');
  const payload = jwt.verify(token, secret);
  if (payload.tokenType !== 'access') throw new Error('Invalid access token');
  return payload;
};

module.exports = { verify };
