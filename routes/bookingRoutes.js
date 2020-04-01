const express = require('express');

const bookingCtrl = require('./../controllers/bookingController');
const authCtrl = require('./../controllers/authController');

const router = express.Router();

router.use(authCtrl.protect);
// route to book a tour
router.get('/checkout-session/:tourId', bookingCtrl.getCheckoutSession);

router.use(authCtrl.restrictTo('admin'));
router
    .route('/')
    .get(bookingCtrl.getAllBookings)
    .post(bookingCtrl.createBooking);

router
    .route('/:bookingId')
    .get(bookingCtrl.getBooking)
    .patch(bookingCtrl.updateBooking)
    .delete(bookingCtrl.deleteBooking);

module.exports = router;
