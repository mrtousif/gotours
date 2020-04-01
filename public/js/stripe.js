/* disable-eslint */
import axios from 'axios';
import alert from './alerts';
// Set your publishable key: remember to change this to your live publishable key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = Stripe('pk_test_UICrsYQjtxjKuBY1WXy2jCWp00LJne2UQu');
const elements = stripe.elements();

export const bookTour = async tourId => {
    try {
        // get checkout session
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        // console.log(session);
        // create checkout and charge
        stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (error) {
        // console.log(error);
        alert('error', error.message);
    }
};
