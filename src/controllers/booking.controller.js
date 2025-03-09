const Booking = require('../models/booking.model');
const Listing = require('../models/listing.model');
const { validationResult } = require('express-validator');

// Get all bookings for a user (as renter or owner)
exports.getMyBookings = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = {};
    
    if (role === 'renter') {
      query.renter = req.user.id;
    } else if (role === 'owner') {
      query.owner = req.user.id;
    } else {
      // If no role specified, get all bookings where user is either renter or owner
      query = {
        $or: [
          { renter: req.user.id },
          { owner: req.user.id }
        ]
      };
    }
    
    const bookings = await Booking.find(query)
      .populate({
        path: 'listing',
        select: 'title images category size brand condition rentalPrice'
      })
      .populate({
        path: 'renter',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'owner',
        select: 'firstName lastName profileImage'
      })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// Get single booking
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'listing',
        select: 'title images category size brand condition rentalPrice'
      })
      .populate({
        path: 'renter',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'owner',
        select: 'firstName lastName profileImage'
      });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is the renter or owner
    if (booking.renter._id.toString() !== req.user.id && booking.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this booking' });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Create new booking
exports.createBooking = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { listingId, startDate, endDate } = req.body;
    
    // Find the listing
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Check if listing is active
    if (!listing.isActive) {
      return res.status(400).json({ message: 'This listing is not available for booking' });
    }
    
    // Check if user is not booking their own listing
    if (listing.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot book your own listing' });
    }
    
    // Calculate total price
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (days < 1) {
      return res.status(400).json({ message: 'Booking must be for at least one day' });
    }
    
    const totalPrice = days * listing.rentalPrice.daily;
    
    // Create booking
    const booking = await Booking.create({
      listing: listingId,
      renter: req.user.id,
      owner: listing.owner,
      startDate,
      endDate,
      totalPrice,
      status: 'Requested',
      paymentStatus: 'Pending'
    });
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Approved', 'Rejected', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user is the owner (for approve/reject) or renter (for cancel)
    if (status === 'Approved' || status === 'Rejected') {
      if (booking.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }
    } else if (status === 'Cancelled') {
      if (booking.renter.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to cancel this booking' });
      }
      
      // Can only cancel if status is Requested or Approved
      if (booking.status !== 'Requested' && booking.status !== 'Approved') {
        return res.status(400).json({ message: `Cannot cancel booking with status ${booking.status}` });
      }
    } else if (status === 'Completed') {
      // Both owner and renter can mark as completed
      if (booking.owner.toString() !== req.user.id && booking.renter.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }
      
      // Can only complete if status is Approved
      if (booking.status !== 'Approved') {
        return res.status(400).json({ message: 'Can only complete approved bookings' });
      }
    }
    
    booking.status = status;
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
