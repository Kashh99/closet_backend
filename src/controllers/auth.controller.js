const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Register user
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, firstName, lastName, university } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      university,
      isVerified: true, // Set to true since we're not requiring email verification
    });
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        university: user.university,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user and include password in the result
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        university: user.university,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        university: user.university,
        bio: user.bio,
        isVerified: user.isVerified,
        sizes: user.sizes,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // TODO: Send email with reset token
    // For development, just return the token
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
