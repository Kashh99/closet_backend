const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user in request
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
  } catch (error) {
    next(error);
  }
};
