const express = require('express');
const tourCtrl = require('./../controllers/tourController');
const authCtrl = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// param middleware
// router.param('id', tourCtrl.checkID);

// redirect to reviewRouter for the url /tourId/reviews
router.use('/:tourId/reviews', reviewRouter);

router.get('/top-5-tours', tourCtrl.aliasTop5Tours, tourCtrl.getAllTours);
router.route('/tour-stats').get(tourCtrl.getTourStats);
router
    .route('/monthly-plan/:yr')
    .get(
        authCtrl.protect,
        authCtrl.restrictTo('admin', 'lead-guide', 'guide'),
        tourCtrl.getMonthlyPlan
    );

router.get(
    '/tours-within/:distance/center/:coordinate/unit/:unit',
    tourCtrl.getToursWithIn
);

router.get('/distances/:coordinate/unit/:unit', tourCtrl.getDistances);

router
    .route('/')
    .get(tourCtrl.getAllTours)
    .post(authCtrl.protect, authCtrl.restrictTo('admin'), tourCtrl.createTour);

router
    .route('/:id') // id is tour id
    .get(tourCtrl.getTour) // get single tour
    .patch(
        authCtrl.protect,
        authCtrl.restrictTo('admin', 'lead-guide'),
        tourCtrl.updateTour
    )
    .delete(
        authCtrl.protect,
        authCtrl.restrictTo('admin'),
        tourCtrl.deleteTour
    );

module.exports = router;
