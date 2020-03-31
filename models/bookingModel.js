const mongoose = require('mongoose');

// schema
const bookingSchema = new mongoose.Schema({
    // schema definitions
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'A booking must belong to a tour']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A booking must belong to a user']
    },
    price: {
        type: Number,
        required: [true, 'Booking must have a price']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
});

bookingSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'tour',
        select: 'name'
    }).populate('user');

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
