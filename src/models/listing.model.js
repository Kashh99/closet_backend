const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Casual', 'Formal', 'Party', 'Business', 'Athletic', 'Accessories'],
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Men', 'Women', 'Unisex'],
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
  },
  brand: String,
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['New', 'Like New', 'Good', 'Fair'],
  },
  rentalPrice: {
    daily: {
      type: Number,
      required: [true, 'Daily rental price is required'],
    },
    weekly: Number,
  },
  depositAmount: {
    type: Number,
    required: [true, 'Deposit amount is required'],
  },
  images: {
    type: [String],
    required: [true, 'At least one image is required'],
    validate: [val => val.length >= 1, 'At least one image is required'],
  },
  tags: [String],
  location: {
    building: String,
    details: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
