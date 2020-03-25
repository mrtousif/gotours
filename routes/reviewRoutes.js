const express = require('express');
const reviewCtrl = require('./../controllers/reviewController');
const authCtrl = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
// POST /tours/:tourId/reviews
// /reviews
// id is review id

router.use(authCtrl.protect);

router
    .route('/:id')
    .get(reviewCtrl.getReview)
    .patch(authCtrl.restrictTo('user'), reviewCtrl.updateReview)
    .delete(authCtrl.restrictTo('user', 'admin'), reviewCtrl.deleteReview);

router
    .route('/')
    .get(reviewCtrl.getAllReviews)
    .post(
        authCtrl.restrictTo('user'),
        reviewCtrl.setTourUserIds,
        reviewCtrl.createReview
    );

module.exports = router;
