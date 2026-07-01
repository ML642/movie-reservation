const express = require('express');
const authMiddleware = require('../middleWare/authMiddleware');
const controller = require('../controllers/likedMovieController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', controller.listLikedMovies);
router.post('/', controller.addLikedMovie);
router.delete('/', controller.removeLikedMovie);
router.delete('/:movieKey', controller.removeLikedMovie);

module.exports = router;
