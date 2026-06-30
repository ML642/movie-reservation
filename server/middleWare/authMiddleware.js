const { getUsernameFromToken } = require('../utils/auth');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to make a reservation',
    });
  }
  const token = authHeader.split(' ')[1];
  const user = getUsernameFromToken(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
  req.user = user;
  next();
};