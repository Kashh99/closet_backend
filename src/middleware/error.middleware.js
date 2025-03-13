const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'StripeError') {
    return res.status(400).json({
      success: false,
      message: 'Payment processing error',
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

module.exports = errorHandler;