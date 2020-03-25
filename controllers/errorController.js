const AppError = require('./../utils/AppError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errorMessages = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errorMessages.join('. ')}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = err => {
    const message = `Duplicate field value name: ${err.keyValue.name}`;
    // const msg = err.errmsg.match(/(['"])((\\\1|.)*?)\1/gm);
    // const msg = err.errmsg.match(/"([^"]*)"/);
    // const message = `Duplicate field value name: ${msg}`;
    return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
    return new AppError('Invalid token. Please log in again', 401);
};

const handleTokenExpiredError = () => {
    return new AppError('Expired token. Please log in again', 401);
};

const sendErrorDev = (err, req, res) => {
    //a) if request url starts with /api
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack
        });
    }
    //b) render error page
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        message: err.message
    });
};

const sendErrorProd = (err, req, res) => {
    // log the error to the console
    console.error('PRODUCTION ERROR:', err);
    console.log('starts_with_/api:', req.originalUrl.startsWith('/api'));
    //a) if request url starts with /api
    if (req.originalUrl.startsWith('/api')) {
        // operational, trusted errors to the client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // programming errors or unknown errors, do not leak
        // send generic error to the client
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }

    //b) request url does not starts with /api
    // if error is operational, render the message to the client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            message: err.message
        });
    }
    // error is not operational
    // render error page with generic message
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        message: 'Please try again later'
    });
};

// global error handler using express middleware
// called from catchAsync()
module.exports = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // errors for development
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        // errors for production
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        } else if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        } else if (error.code === 11000) {
            error = handleDuplicateFieldsErrorDB(error);
        } else if (error.name === 'JsonWebTokenError') {
            error = handleJsonWebTokenError();
        } else if (error.name === 'TokenExpiredError') {
            error = handleTokenExpiredError();
        }
        // production error
        sendErrorProd(error, req, res);
    }
};
