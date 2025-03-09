const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/:id', userController.getUserProfile);

// Protected routes
router.use(protect);

// Update profile
router.put(
  '/profile',
  [
    body('firstName').optional().not().isEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().not().isEmpty().withMessage('Last name cannot be empty'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters')
  ],
  userController.updateProfile
);

// Change password
router.put(
  '/password',
  [
    body('currentPassword').not().isEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  userController.changePassword
);

module.exports = router;
