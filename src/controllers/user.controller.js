const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// Get user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        university: user.university,
        bio: user.bio,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { firstName, lastName, profileImage, bio, sizes } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (profileImage) user.profileImage = profileImage;
    if (bio) user.bio = bio;
    if (sizes) {
      user.sizes = {
        ...user.sizes,
        ...sizes
      };
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
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

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Set new password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
