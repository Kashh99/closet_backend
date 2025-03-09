const express = require('express');
const { body } = require('express-validator');
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/listing/:listingId', reviewController.getListingReviews);

// Protected routes
router.use(protect);

// Create a review
router.post(
  '/',
  [
    body('bookingId').not().isEmpty().withMessage('Booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').not().isEmpty().withMessage('Comment is required')
  ],
  reviewController.createReview
);

// Update a review
router.put(
  '/:id',
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().not().isEmpty().withMessage('Comment cannot be empty')
  ],
  reviewController.updateReview
);

// Delete a review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
