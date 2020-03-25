// catch async errors
const catchAsync = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next); // err => next(err)
        // if there is error. err object is sent straight to the global errorController
    };
};

module.exports = catchAsync;
