const { promisify } = require('util'); // promisify() makes a synchronous function asynchronous
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/AppError');
const catchAsync = require('./../utils/catchAsync');
const emailer = require('./../utils/emailer');

const signToken = userId => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN // validity of the token
    });
    return token;
};

const signAndSendToken = (userId, statusCode, res) => {
    const token = signToken(userId);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // 70days
        ),
        httpOnly: true // not modifiable by the browser
    };
    // users will be able to log in only in https connection in production
    if (process.env.NODE_ENV === 'production') {
        //when in production cookie will be sent only on https connection
        cookieOptions.secure = true;
    }
    // send cookie
    res.cookie('jwt', token, cookieOptions);

    // user.password = undefined; when sending user data in response

    res.status(statusCode).json({
        status: 'success',
        token
    });
};

// create user account
exports.signup = catchAsync(async (req, res, next) => {
    // never do: const newUser = await User.create(req.body)
    // check if user account already exists in the db
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        return next(
            new AppError(
                'An account with that email is already exist. You need to login',
                403
            )
        );
    }
    // load new user data into the db
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    });

    // create new token
    // const token = signToken(newUser._id);
    // send token
    signAndSendToken(newUser._id, 201, res);
});

// Stage 1 Authentication --- Login --- check for identity
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // find user account in db
    const user = await User.findOne({ email }).select('+password');

    // check if user exists, if yes then check password if incorrect send error
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    //if everything is ok then sign and send token to the client
    signAndSendToken(user._id, 200, res);
});

// Stage 2 authentication --- Access to logged in user
exports.protect = catchAsync(async (req, res, next) => {
    // Get token and check if it exists
    let token;
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // extract the token part from the string
        token = req.headers.authorization.split(' ')[1];
    }
    // check token if it exists
    if (!token) {
        return next(new AppError('You need to login to get access', 401));
    }
    // verify token and extract data
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //decoded{ id: '---', iat: ---, exp: --- }
    // check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('Please login first', 401));
    }

    // check if user has changed password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError('Password changed recently. Please login', 401)
        );
    }

    // load user data to the request object
    req.user = user;
    // make it accessible to the template
    res.locals.user = user;
    // grant access to the protected route
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    try {
        if (!req.cookies.jwt) {
            return next();
        }
        const token = req.cookies.jwt;
        // verify token and extract data
        const decoded = await promisify(jwt.verify)(
            token,
            process.env.JWT_SECRET
        );
        //decoded{ id: '---', iat: ---, exp: --- }
        // check if user exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next();
        }
        // console.log(user);
        // check if user has changed password after the token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return next();
        }
        // user is logged in
        // make it accessible to the template
        res.locals.user = user;
    } catch (error) {
        return next();
    }

    next();
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'dummy_text', {
        expires: new Date(Date.now() + 1000), // 1second
        httpOnly: true
    });

    res.status(200).json({
        status: 'success'
    });
};

// Authorization --- check for permission
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles = ['admin', 'lead-guide']
        // check if current user role is in roles[]
        if (!roles.includes(req.user.role)) {
            // unauthorized
            next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        // grant access
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // find sent email in the db
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        next(new AppError('You need to sign up', 404));
    }
    // generate temporary password or random reset token
    const resetToken = user.createPasswordResetToken();
    // deactivate validators of the user and save it to the db
    await user.save({ validateBeforeSave: false });

    // create reset url
    const resetUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/reset-password/${resetToken}`;
    // send it to the user's email
    try {
        await emailer({
            email: user.email,
            subject: 'Password reset. Valid for 20 minutes',
            message: `Forgot your password? \n\nTo reset your password please click the link below: \n${resetUrl} \n\nIf you suspect someone may have unauthorized access to your account, we suggest you to change your password.`
        });

        res.status(200).json({
            status: 'success',
            message: 'Reset url set to the email'
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.resetTokenExpiresAt = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('Failure to send email. Try again later', 500)
        );
    }
});

// password reset
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { resetToken } = req.params;
    // check if token exist
    if (!resetToken) {
        return next(new AppError('Invalid URL', 400));
    }
    // hash the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // find user and check the token if it is expired
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        resetTokenExpiresAt: { $gt: Date.now() }
    });
    // if token has not expired, and user is valid then set new password
    if (!user) {
        return next(new AppError('Token is invalid or expired', 400));
    }
    // set new password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    // user.passwordResetToken = undefined;
    // user.resetTokenExpiresAt = undefined;
    user.save();
    // login the user. send JWT
    signAndSendToken(user._id, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // user already logged in i.e. JWT verified
    // console.log(req);
    // get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // console.log(user);
    // verify current password
    const checkPass = await user.correctPassword(
        req.body.currentPassword,
        user.password
    );
    if (!checkPass) {
        return next(new AppError('Incorrect password', 401));
    }
    // set new password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();
    // issue new jwt and send it
    signAndSendToken(user._id, 200, res);
});
