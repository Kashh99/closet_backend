// This is an example for an Express.js backend

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth.middleware');
const { authenticateToken } = require('../middleware/auth.middleware'); // This line is redundant - you don't need both protect and authenticateToken
const Booking = require('../models/booking.model');

// Create a payment intent
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    // Get the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Make sure the user is the renter
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Make sure the booking hasn't been paid for yet
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Booking has already been paid for' });
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id
      }
    });
    
    // Update the booking with the payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Handle webhook events from Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update the booking record
      try {
        const { bookingId } = paymentIntent.metadata;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          console.error('Booking not found:', bookingId);
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        booking.paymentStatus = 'paid';
        booking.stripePaymentId = paymentIntent.id;
        booking.status = 'confirmed';
        await booking.save();
        
        // Here you could send confirmation emails, etc.
        
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      try {
        const { bookingId } = failedPayment.metadata;
        
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentStatus = 'failed';
          await booking.save();
        }
      } catch (error) {
        console.error('Error processing failed payment:', error);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.status(200).json({ received: true });
});

// Get payment history for a user
router.get('/history', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user.id,
      paymentStatus: { $in: ['paid', 'refunded'] }
    })
    .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;