const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/reservationController');

router.get('/seats', controller.getSeats);

router.use(authMiddleware);

router.post('/', controller.createReservation);
router.get('/all', controller.getAllForUser);
router.post('/id', controller.getByUserId);
router.delete('/delete/:id', controller.deleteReservation);

module.exports = router;