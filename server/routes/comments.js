const express = require('express');
const authMiddleware = require('../middleWare/authMiddleware');
const controller = require('../controllers/commentController');

const router = express.Router();

router.get('/:movieId', controller.listComments);
router.post('/:movieId', authMiddleware, controller.addComment);
router.patch('/:commentId', authMiddleware, controller.updateComment);
router.delete('/:commentId', authMiddleware, controller.removeComment);

module.exports = router;
