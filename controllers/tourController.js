// const fs = require('fs');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./handlerFactory');
const multer = require('multer'); // multi part form data
const sharp = require('sharp');
// const tourFilePath = `${__dirname}/../dev-data/data/tours-simple.json`;
// const tours = JSON.parse(fs.readFileSync(tourFilePath, 'utf-8'));

// check sent id
// exports.checkID = (req, res, next, val) => {
//     // console.log(`Tour id is ${val}`);
//     const sentId = req.params.id * 1; // turned string to int
//     if (sentId > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'invalid id'
//         });
//     }
//     next();
// };

// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'fail',
//             message: 'invalid data'
//         });
//     }
//     next();
// };

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
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// upload.array('images', 5);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    console.log(req.files);
    if (!req.files) return next();
    // cover image
    if (req.files.imageCover) {
        // set the file name
        req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
        // to resize the photo
        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 85 })
            .toFile(`public/img/tours/${req.body.imageCover}`);
    }
    // images
    if (req.files.images) {
        req.body.images = [];
        await Promise.all(
            req.files.images.map(async (file, i) => {
                const filename = `tour-${req.params.id}-${i + 1}.jpeg`;

                await sharp(file.buffer)
                    .resize(2000, 1333)
                    .toFormat('jpeg')
                    .jpeg({ quality: 85 })
                    .toFile(`public/img/tours/${filename}`);

                req.body.images.push(filename);
            })
        );
    }

    next();
});

// middleware
exports.aliasTop5Tours = (req, res, next) => {
    req.query = {
        sort: '-ratingsAverage,price',
        limit: '5',
        fields: 'name,price,ratingsAverage,summary,duration,difficulty'
    };
    next();
};

// route handlers
exports.getAllTours = factory.getAll(Tour);

// exports.getTour = factory.getOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 4.5 } } },
        {
            $group: {
                // _id: '$difficulty',
                // _id: { $toUpper: '$difficulty' },
                _id: null,
                numOfTours: { $sum: 1 }, // add 1 for each document
                numOfRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        { $sort: { avgPrice: 1 } } // 1 for ascending
        // { $match: { _id: { $ne: 'EASY' } } }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.yr * 1; // 2021 convert it to int
    const plan = await Tour.aggregate([
        { $unwind: '$startDates' },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        { $addFields: { month: '$_id' } },
        { $project: { _id: 0 } },
        { $sort: { numToursStarts: -1 } }, // -1 for descending
        { $limit: 12 }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});

exports.getToursWithIn = catchAsync(async (req, res, next) => {
    // '/tours-within/:distance/center/:coordinate/unit/:unit'
    // '/tours-within/233/center/34.111745,-118.113491/unit/mi'
    const { distance, coordinate, unit } = req.params;
    const [latitude, longitude] = coordinate.split(',');
    //radians
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!latitude || !longitude) {
        next(
            new AppError(
                'Please provide the location coordinate as latitude,longitude',
                400
            )
        );
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: { $centerSphere: [[longitude, latitude], radius] }
        }
    });
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: { tours }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    // '/distances/:coordinate/unit/:unit'
    // '/distances/34.111745,-118.113491/unit/mi'
    const { coordinate, unit } = req.params;
    const [latitude, longitude] = coordinate.split(',');

    if (!latitude || !longitude) {
        next(new AppError('Please provide latitude,longitude', 400));
    }

    const multiplier = unit === 'mi' ? 0.000621 : 0.001;

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [longitude * 1, latitude * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: { distances }
    });
});

// exports.getTour = catchAsync(async (req, res, next) => {
//     // console.log(req.requestedAt);
//     // console.log(req.params);
//     const tour = await Tour.findById(req.params.id).populate('reviews');
//     // Tour.findOne({ _id: req.params.id })
//     // const tour = tours.find(el => el.id === id);
//     // if tour not found
//     if (!tour) {
//         return next(new AppError('Invalid ID', 404));
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

// exports.createTour = async (req, res) => {
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);

// tours.push(newTour);

// fs.writeFile(tourFilePath, JSON.stringify(tours), err => {
//     if (err) console.log(err);

//     res.status(201).json({
//         status: 'success'
//         data: {
//             tour: newTour
//         }
//     });
// });
// };

// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         // update does not run validators by default
//         runValidators: true
//     });
//     if (!tour) {
//         return next(new AppError('Invalid ID', 404));
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         return next(new AppError('Invalid ID', 404));
//     }

//     res.status(204).json({
//         status: 'success',
//         data: null
//     });
// });

// assign data
// const testTour = new Tour({
//     name: 'The Forest Hiker',
//     rating: 4.7,
//     price: 499
// });

// testTour
//     .save()
//     .then(doc => console.log(doc))
//     .catch(err => console.error(err));
