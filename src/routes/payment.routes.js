const express = require('express');
const stripe = require('../config/stripe');
const { protect } = require('../middleware/auth.middleware');
const paymentService = require('../services/payment.service');
const Booking = require('../models/booking.model');

const router = express.Router();

// Protect all routes except webhook
router.use('/webhook', express.raw({ type: 'application/json' }));
router.use(protect);

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Verify booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent(
      booking.totalAmount,
      bookingId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
});

// Get payment status
router.get('/status/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
      error: error.message
    });
  }
});

// Webhook handler - should be unprotected
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await paymentService.handleSuccessfulPayment(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await paymentService.handleFailedPayment(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;