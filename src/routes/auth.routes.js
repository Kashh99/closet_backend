const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Register route with validation
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('firstName').not().isEmpty().withMessage('First name is required'),
    body('lastName').not().isEmpty().withMessage('Last name is required'),
    body('university').not().isEmpty().withMessage('University is required')
  ],
  authController.register
);

// Login route
router.post('/login', authController.login);

// Get current user route (protected)
router.get('/me', protect, authController.getCurrentUser);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

// Reset password route
router.put('/reset-password/:resetToken', authController.resetPassword);

module.exports = router;
