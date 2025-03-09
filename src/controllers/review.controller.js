const Review = require('../models/review.model');
const Booking = require('../models/booking.model');
const { validationResult } = require('express-validator');

// Get reviews for a user
exports.getUserReviews = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    const reviews = await Review.find({ reviewee: userId })
      .populate({
        path: 'reviewer',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'listing',
        select: 'title images'
      })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a listing
exports.getListingReviews = async (req, res, next) => {
  try {
    const listingId = req.params.listingId;
    
    const reviews = await Review.find({ listing: listingId })
      .populate({
        path: 'reviewer',
        select: 'firstName lastName profileImage'
      })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Create a review
exports.createReview = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { bookingId, rating, comment } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is the renter of the booking
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }
    
    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId, reviewer: req.user.id });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }
    
    // Create review
    const review = await Review.create({
      booking: bookingId,
      reviewer: req.user.id,
      reviewee: booking.owner,
      listing: booking.listing,
      rating,
      comment
    });
    
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Update a review
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    
    // Find the review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    
    await review.save();
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review
exports.deleteReview = async (req, res, next) => {
  try {
    // Find the review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    await review.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
