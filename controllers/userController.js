// const fs = require('fs');
const multer = require('multer'); // multi part form data

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./handlerFactory');

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];

        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    }
});

const multerFilter = (req, file, cb) => {};

const upload = multer({ dest: 'public/img/users' });

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
    const filteredObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            filteredObj[el] = obj[el];
        }
    });
    return filteredObj;
};

exports.getAllUsers = factory.getAll(User);

// users are added via sign up
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined. Please use /signup instead.'
    });
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // check if user sent password
    if (req.body.password || req.body.confirmPassword) {
        return next(
            new AppError(
                'This route is not for updating password. Use /update-password instead.',
                400
            )
        );
    }
    // update details
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deactivateMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(200).json({
        status: 'success',
        data: null
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.user._id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// do not update password using this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.getUser = factory.getOne(User);
