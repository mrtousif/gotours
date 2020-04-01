// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory'); // returns functions

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // grt currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${
            req.params.tourId
        }&user=${req.user._id}&price=${tour.price}`,
        // success?session_id={CHECKOUT_SESSION_ID}

        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        client_reference_id: req.params.tourId,
        customer_email: req.user.email,

        // data about the product or service
        line_items: [
            {
                name: tour.name,
                description: tour.summary,
                images: [
                    `https://gotours-touring-app-101.herokuapp.com/img/tours/${tour.imageCover}`
                ],
                amount: 100 * tour.price,
                currency: 'usd',
                quantity: 1
            }
        ]
    });

    // create session and price
    res.status(200).json({
        status: 'success',
        session
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // UNSECURE
    const { tour, user, price } = req.query;
    if (!tour && !user && !price) {
        return next();
    }
    await Booking.create({
        tour,
        user,
        price
    });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);

exports.getBooking = factory.getOne(Booking);

exports.getAllBookings = factory.getAll(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
