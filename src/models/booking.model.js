const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Requested', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Requested',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending',
  },
}, { timestamps: true });

// Validate that endDate is after startDate
bookingSchema.pre('validate', function(next) {
  if (this.startDate >= this.endDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
