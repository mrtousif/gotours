const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();

    res.status(200).render('overview', {
        title: 'All tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({ slug: req.params.slug });
    // const tour = await await Tour.findOne({ slug: req.params.slug }).populate({
    //     path: 'reviews',
    //     select: 'review rating user'
    // });
    // console.log(tour);
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    res.status(200).render('tour', {
        title: tour.name,
        tour
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    // console.log(tour);
    res.status(200).render('login', {
        title: 'Login'
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true, // get updated document as result
            runValidators: true
        }
    );

    res.status(200).render('account', {
        title: 'Account',
        user: updatedUser
    });
});
