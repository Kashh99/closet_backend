const Listing = require('../models/listing.model');
const { validationResult } = require('express-validator');

// Get all listings
exports.getAllListings = async (req, res, next) => {
  try {
    // Build query with filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Find active listings only (unless admin or owner)
    let query = Listing.find({ ...JSON.parse(queryStr), isActive: true }).populate('owner', 'firstName lastName profileImage');
    
    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    query = query.skip(skip).limit(limit);
    
    // Execute query
    const listings = await query;
    
    // Get total count for pagination
    const total = await Listing.countDocuments({ ...JSON.parse(queryStr), isActive: true });
    
    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: listings
    });
  } catch (error) {
    next(error);
  }
};

// Get single listing
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', 'firstName lastName profileImage university');
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    res.status(200).json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

// Create new listing
exports.createListing = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Add owner to request body
    req.body.owner = req.user.id;
    
    const listing = await Listing.create(req.body);
    
    res.status(201).json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

// Update listing
exports.updateListing = async (req, res, next) => {
  try {
    let listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Check if user is listing owner
    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }
    
    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

// Delete listing
exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Check if user is listing owner
    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }
    
    await listing.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Get my listings
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ owner: req.user.id });
    
    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    next(error);
  }
};
