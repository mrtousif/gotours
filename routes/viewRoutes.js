const express = require('express');
const viewCtrl = require('./../controllers/viewController');
const authCtrl = require('./../controllers/authController');
const bookingCtrl = require('./../controllers/bookingController');

const router = express.Router();

// router.use();
// route to front-end server side rendered
router
    .route('/')
    .get(
        bookingCtrl.createBookingCheckout,
        authCtrl.isLoggedIn,
        viewCtrl.getOverview
    );

router.get('/tour/:slug', authCtrl.isLoggedIn, viewCtrl.getTour);

router.get('/login', authCtrl.isLoggedIn, viewCtrl.getLoginForm);

router.get('/me', authCtrl.protect, viewCtrl.getAccount);
// about us page
router.get('/about', viewCtrl.getAbout);

router.get('/my-tours', authCtrl.protect, viewCtrl.getMyTours);

// for submitting form in old way
// router.post('/submit-user-from', authCtrl.protect, viewCtrl.updateUserData);

module.exports = router;
