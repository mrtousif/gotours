const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// schema
const tourSchema = new mongoose.Schema(
    {
        // schema definitions
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour must have maximum 40 characters'],
            minlength: [10, 'A tour must have minimum 10 characters']
            // validate: [
            //     validator.isAlpha,
            //     'Tour name must only contain characters not even spaces'
            // ]
        },
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty level'],
            enum: {
                // only for strings
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficult is either: easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.0,
            min: [1.0, 'Minimum rating 1.0'],
            max: [5.0, 'Maximum rating 5.0'],
            set: val => Math.round(val * 10) / 10 // 4.66666 => 46.6666 => 47 => 4.7
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            // custom validator
            validate: {
                validator: function(val) {
                    // 'this' only points to current doc on new document creation
                    // validator does not to run on update
                    return val < this.price;
                },
                message:
                    'Discount price ({VALUE}) must be less than regular price'
                // here val is VALUE
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have summary']
        },
        description: {
            type: String,
            trim: true,
            required: [true, 'A tour must have description']
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a image cover']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        slug: String,
        secretTours: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            // embedding document
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [
            // child referencing
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        // schema options --- to include virtual properties in the result
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);
// indexing
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
//compound indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });

// virtual property - does not save to the db. created each time we get data out of the db
tourSchema.virtual('durationWeeks').get(function() {
    // returns days in number of weeks
    return this.duration / 7;
    // arrow function does not get it's own 'this' keyword
});

// virtual populate
tourSchema.virtual('reviews', {
    // ref to Review
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// document middleware: runs before .create() or .save() only but not update()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// document middleware: runs after .save() or .create()
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });

// document model
// The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name.

// query middleware: runs before find queries(any queries starts with find)
tourSchema.pre('find', function(next) {
    // tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });
    this.select('-description');
    next();
});

tourSchema.pre(/^findOne/, function(next) {
    this.populate({
        path: 'guides',
        select: 'role name photo'
        // select: '-__v -passwordChangedAt'
    }).populate({
        path: 'reviews',
        select: ''
    });
    // this.populate({
    //     path: 'guides',
    //     select: 'role name photo'
    // });
    // to measure processing time
    this.start = Date.now();
    next();
});

// query middleware: runs after find queries(any queries starts with find)
tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start}ms`);
    next();
});

// AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({ $match: { selectTour: { $ne: true } } });
//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
