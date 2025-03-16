// This is an example for an Express.js backend

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth.middleware');
const { authenticateToken } = require('../middleware/auth.middleware'); // Adjust based on your auth setup
const Order = require('../models/Order'); // Adjust based on your models

// Create a payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd', items } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // You might want to validate the items here
    // For example, fetch them from the database to ensure prices are correct
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        userId: req.user.id,
        items: JSON.stringify(items.map(item => ({ id: item.id, quantity: item.quantity })))
      }
    });
    
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
      
      // Create an order record
      try {
        const { userId, items } = paymentIntent.metadata;
        const parsedItems = JSON.parse(items);
        
        await Order.create({
          userId,
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          items: parsedItems,
          status: 'paid',
          paymentDate: new Date()
        });
        
        // Update inventory, send confirmation emails, etc.
        
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.status(200).json({ received: true });
});

// Get payment history for a user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ paymentDate: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;