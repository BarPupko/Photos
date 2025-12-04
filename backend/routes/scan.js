const express = require('express');
const router = express.Router();
const path = require('path');
const { scanPhotoLibrary } = require('../services/photoScanner');

let isScanning = false;
let lastScanResult = null;

// Start photo library scan
router.post('/start', async (req, res) => {
  if (isScanning) {
    return res.status(409).json({
      error: 'Scan already in progress',
      isScanning: true
    });
  }

  const libraryPath = process.env.PHOTO_LIBRARY_PATH;
  const thumbnailDir = path.join(__dirname, '..', process.env.THUMBNAIL_PATH || 'thumbnails');

  if (!libraryPath) {
    return res.status(400).json({
      error: 'PHOTO_LIBRARY_PATH not configured'
    });
  }

  // Start scan in background
  isScanning = true;
  res.json({
    message: 'Photo library scan started',
    libraryPath,
    isScanning: true
  });

  try {
    const result = await scanPhotoLibrary(libraryPath, thumbnailDir);
    lastScanResult = {
      ...result,
      completedAt: new Date().toISOString()
    };
    isScanning = false;
  } catch (error) {
    console.error('Scan error:', error);
    lastScanResult = {
      error: error.message,
      completedAt: new Date().toISOString()
    };
    isScanning = false;
  }
});

// Get scan status
router.get('/status', (req, res) => {
  res.json({
    isScanning,
    lastScanResult
  });
});

module.exports = router;
