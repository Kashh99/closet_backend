const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all bookings for the current user
router.get('/', bookingController.getMyBookings);

// Get a single booking
router.get('/:id', bookingController.getBookingById);

// Create a new booking
router.post(
  '/',
  [
    body('listingId').not().isEmpty().withMessage('Listing ID is required'),
    body('startDate').isISO8601().toDate().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().toDate().withMessage('End date must be a valid date')
  ],
  bookingController.createBooking
);

// Update booking status
router.patch(
  '/:id/status',
  [
    body('status').isIn(['Approved', 'Rejected', 'Completed', 'Cancelled']).withMessage('Invalid status')
  ],
  bookingController.updateBookingStatus
);

module.exports = router;
