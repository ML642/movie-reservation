const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (userService.findUserByEmail(email) || userService.findUserByUsername(username)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await userService.createUser({ username, email, password });
    const token = jwt.sign(
      { userId: user.id, username: user.username, userEmail: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginId = (email || '').trim();
    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Email/username and password are required' });
    }
    const user = userService.findUserByEmail(loginId) || userService.findUserByUsername(loginId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, userEmail: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const userInfo = (req, res) => {
  // This endpoint mirrors previous behavior: allow token-based or body userId
  const authHeader = req.headers['authorization'];
  let decodedToken = null;
  try {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      decodedToken = jwt.verify(token, JWT_SECRET);
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const bodyUserId = req.body.userId;
  const tokenUserId = decodedToken?.userId;
  const id = tokenUserId || bodyUserId;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  if (tokenUserId && bodyUserId && tokenUserId !== bodyUserId) {
    return res.status(403).json({ message: 'Forbidden: user mismatch' });
  }

  const user = userService.findUserById(id);
  if (user) {
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  }

  if (decodedToken && decodedToken.userId === id) {
    return res.json({
      id: decodedToken.userId,
      username: decodedToken.username || 'User',
      email: decodedToken.userEmail || null,
      createdAt: null,
    });
  }

  return res.status(404).json({ message: 'User not found' });
};

const changeInfo = (req, res) => {
const tokenUser = req.user;
  if (!tokenUser || !tokenUser.userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  const tokenUserId = tokenUser.userId;
  const bodyUserId = req.body.userId;
  if (bodyUserId && bodyUserId !== tokenUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: user mismatch' });
  }

  const { newEmail, newName } = req.body;
  if (!newEmail && !newName) {
    return res.status(400).json({ success: false, message: 'Nothing to update' });
  }

  const updated = userService.updateUser(tokenUserId, { newEmail, newName });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: { id: updated.id, username: updated.username, email: updated.email, createdAt: updated.createdAt },
  });
};

const testGet = (req, res) =>
  res.json({ success: true, message: 'test' });

module.exports = {
  register,
  login,
  userInfo,
  changeInfo,
  testGet,
};