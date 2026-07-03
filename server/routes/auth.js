const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleWare/authMiddleware');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/oauth/google', authController.startGoogleOAuth);
router.get('/oauth/google/callback', authController.handleGoogleOAuthCallback);
router.get('/oauth/github', authController.startGithubOAuth);
router.get('/oauth/github/callback', authController.handleGithubOAuthCallback);
router.get('/test', authController.testGet);

// user info: allow token or body userId (keeps prior behavior)
router.post('/userInfo', authController.userInfo);

// changeInfo requires auth
router.patch('/changeInfo', authMiddleware, authController.changeInfo);

module.exports = router;
