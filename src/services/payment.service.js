const stripe = require('../config/stripe');
const Booking = require('../models/booking.model');

const paymentService = {
  async createPaymentIntent(amount, bookingId, userId) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: process.env.STRIPE_CURRENCY || 'usd',
        metadata: {
          bookingId,
          userId
        }
      });

      // Update booking with payment intent ID
      await Booking.findByIdAndUpdate(bookingId, {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Error creating payment intent: ${error.message}`);
    }
  },

  async handleSuccessfulPayment(paymentIntent) {
    const { bookingId } = paymentIntent.metadata;
    
    try {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        stripePaymentId: paymentIntent.id
      });
    } catch (error) {
      throw new Error(`Error updating booking after payment: ${error.message}`);
    }
  },

  async handleFailedPayment(paymentIntent) {
    const { bookingId } = paymentIntent.metadata;
    
    try {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'failed',
        status: 'cancelled'
      });
    } catch (error) {
      throw new Error(`Error updating booking after payment failure: ${error.message}`);
    }
  }
};

module.exports = paymentService;