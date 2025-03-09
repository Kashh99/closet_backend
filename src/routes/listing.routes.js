const express = require('express');
const { body } = require('express-validator');
const listingController = require('../controllers/listing.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', listingController.getAllListings);
router.get('/:id', listingController.getListingById);

// Protected routes
router.use(protect);

// Get my listings
router.get('/my/listings', listingController.getMyListings);

// Create listing with validation
router.post(
  '/',
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').not().isEmpty().withMessage('Description is required'),
    body('category').isIn(['Casual', 'Formal', 'Party', 'Business', 'Athletic', 'Accessories'])
      .withMessage('Invalid category'),
    body('gender').isIn(['Men', 'Women', 'Unisex']).withMessage('Invalid gender'),
    body('size').not().isEmpty().withMessage('Size is required'),
    body('condition').isIn(['New', 'Like New', 'Good', 'Fair']).withMessage('Invalid condition'),
    body('rentalPrice.daily').isNumeric().withMessage('Daily price must be a number'),
    body('depositAmount').isNumeric().withMessage('Deposit amount must be a number'),
    body('images').isArray({ min: 1 }).withMessage('At least one image is required')
  ],
  listingController.createListing
);

// Update listing
router.put('/:id', listingController.updateListing);

// Delete listing
router.delete('/:id', listingController.deleteListing);

module.exports = router;
