const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const APIFeatures = require('./../utils/APIFeatures');

// factory functions
exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                doc: newDoc
            }
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let Query = Model.findById(req.params.id);
        if (popOptions) Query = Query.populate(popOptions);

        const doc = await Query;
        // Tour.findOne({ _id: req.params.id })
        // const doc = tours.find(el => el.id === id);
        // if doc not found
        if (!doc) {
            return next(new AppError('Invalid ID, No document found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    });

exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            // update does not run validators by default
            runValidators: true
        });
        if (!doc) {
            return next(new AppError('Invalid ID. No document found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    });

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('Invalid ID. No document found', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    });

exports.getAll = Model =>
    catchAsync(async (req, res, next) => {
        // to allow nested GET on tour(hack)
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };
        // building the query
        // const tours = await Tour.find()
        //     .where('duration')
        //     .equals(5)
        //     .where('difficulty')
        //     .equals('easy');

        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // execute query
        const docs = await features.query;
        // const docs = await features.query.explain();

        // send response
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: {
                docs
            }
        });
    });
