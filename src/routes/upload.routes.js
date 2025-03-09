const express = require('express');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Upload single image
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      url: req.file.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
});

// Upload multiple images
router.post('/multiple', upload.array('images', 5), async (req, res) => {
  try {
    const urls = req.files.map(file => file.path);
    
    res.status(200).json({
      success: true,
      urls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading images'
    });
  }
});

module.exports = router;
