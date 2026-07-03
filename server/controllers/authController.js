const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const signUserToken = (user) =>
  jwt.sign(
    { userId: user.id, username: user.username, userEmail: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const buildApiBaseUrl = (req) =>
  (process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

const buildOAuthRedirectUri = (req, provider) =>
  `${buildApiBaseUrl(req)}/api/oauth/${provider}/callback`;

const redirectOAuthError = (res, message) => {
  const params = new URLSearchParams({ error: message });
  return res.redirect(`${FRONTEND_URL}/oauth/callback?${params.toString()}`);
};

const redirectOAuthSuccess = (res, user) => {
  const token = signUserToken(user);
  const params = new URLSearchParams({
    token,
    username: user.username,
    email: user.email,
  });

  return res.redirect(`${FRONTEND_URL}/oauth/callback?${params.toString()}`);
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const existingUser =
      (await userService.findUserByEmail(email)) || (await userService.findUserByUsername(username));
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await userService.createUser({ username, email, password });
    const token = signUserToken(user);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'USER_EXISTS') {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
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
    const user = (await userService.findUserByEmail(loginId)) || (await userService.findUserByUsername(loginId));
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signUserToken(user);
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

const userInfo = async (req, res) => {
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

  const user = await userService.findUserById(id);
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

const changeInfo = async (req, res) => {
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

  let updated;
  try {
    updated = await userService.updateUser(tokenUserId, { newEmail, newName });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    if (err.code === 'USER_EXISTS') {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    console.error('Change info error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: { id: updated.id, username: updated.username, email: updated.email, createdAt: updated.createdAt },
  });
};

const testGet = (req, res) =>
  res.json({ success: true, message: 'test' });

const startGoogleOAuth = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return redirectOAuthError(res, 'Google OAuth is not configured');
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: buildOAuthRedirectUri(req, 'google'),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

const handleGoogleOAuthCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return redirectOAuthError(res, 'Missing Google OAuth code');
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectOAuthError(res, 'Google OAuth is not configured');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: buildOAuthRedirectUri(req, 'google'),
        grant_type: 'authorization_code',
      }),
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return redirectOAuthError(res, 'Google OAuth token exchange failed');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = await profileResponse.json();

    if (!profileResponse.ok || !profile.sub) {
      return redirectOAuthError(res, 'Google profile lookup failed');
    }

    const user = await userService.findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
    });

    return redirectOAuthSuccess(res, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return redirectOAuthError(res, 'Google OAuth failed');
  }
};

const startGithubOAuth = (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return redirectOAuthError(res, 'GitHub OAuth is not configured');
  }

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: buildOAuthRedirectUri(req, 'github'),
    scope: 'read:user user:email',
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

const handleGithubOAuthCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return redirectOAuthError(res, 'Missing GitHub OAuth code');
  }

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return redirectOAuthError(res, 'GitHub OAuth is not configured');
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: buildOAuthRedirectUri(req, 'github'),
      }),
    });
    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return redirectOAuthError(res, 'GitHub OAuth token exchange failed');
    }

    const authHeaders = {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'movie-reservation-app',
    };
    const profileResponse = await fetch('https://api.github.com/user', { headers: authHeaders });
    const profile = await profileResponse.json();

    if (!profileResponse.ok || !profile.id) {
      return redirectOAuthError(res, 'GitHub profile lookup failed');
    }

    let email = profile.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: authHeaders });
      const emails = emailsResponse.ok ? await emailsResponse.json() : [];
      email = emails.find((entry) => entry.primary && entry.verified)?.email || emails.find((entry) => entry.verified)?.email;
    }

    const user = await userService.findOrCreateOAuthUser({
      provider: 'github',
      providerId: profile.id,
      email,
      name: profile.name,
      username: profile.login,
    });

    return redirectOAuthSuccess(res, user);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return redirectOAuthError(res, 'GitHub OAuth failed');
  }
};

module.exports = {
  register,
  login,
  userInfo,
  changeInfo,
  testGet,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  startGithubOAuth,
  handleGithubOAuthCallback,
};
