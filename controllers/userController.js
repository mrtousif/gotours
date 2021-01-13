// const fs = require('fs');
const multer = require('multer'); // multi part form data
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./handlerFactory');

// file upload
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];

//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

// buffer storage
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload an image', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    // set the file name
    req.file.filename = `user-${req.user.id}-${Date.now()}.webp`;
    // console.log(req.file.buffer);
    // to resize the photo
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('webp')
        .jpeg({ quality: 50 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

const filterObj = (obj, ...allowedFields) => {
    const filteredObj = {};
    Object.keys(obj).forEach((el) => {
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
        message: 'This route is not defined. Please use /signup instead.',
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
    // console.log(req.file);
    if (req.file) {
        filteredBody.photo = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deactivateMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(200).json({
        status: 'success',
        data: null,
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.user._id);

    res.status(204).json({
        status: 'success',
        data: null,
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
