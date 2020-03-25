const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        title: {
            type: String,
            maxlength: 40
        },
        review: {
            type: String,
            maxlength: 1000
        },
        tour: {
            // ref to Tour -- parent referencing
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour']
        },
        user: {
            // ref to User
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

// static method called on the model not document
reviewSchema.statics.calcAvgRatings = async function(tourId) {
    // calculates average rating and number of ratings of a tour from it's reviews
    // must be called just after when a review is saved to the db
    // it will be called on the model
    const stats = await this.aggregate([
        // select all the reviews belongs to tourId
        { $match: { tour: tourId } },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        // saving the stats of the tour
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        // no review exists
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4
        });
    }
};

// called after new review is created
reviewSchema.post('save', function() {
    // this refers to the document is just saved
    // this.constructor refers to the model from which the document is created -- Review
    this.constructor.calcAvgRatings(this.tour);
});

// findByIdAndUpdate and findByIdAndDelete have query middleware, not document middleware
// to call the calcAvgRatings() when a review is updated
reviewSchema.pre(/^findOneAnd/, async function(next) {
    // don't have access to the model Review here
    // this refers to the query object
    this.r = await this.findOne();
    // console.log(r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    // this.findOne() does not work here because it's already executed
    // this.r.constructor is the Review model
    await this.r.constructor.calcAvgRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
