const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current configuration
router.get('/', (req, res) => {
  try {
    const libraryPath = process.env.PHOTO_LIBRARY_PATH;
    const libraryExists = fs.existsSync(libraryPath);

    // Get disk capacity (Windows/Unix compatible)
    let diskCapacity = null;
    try {
      if (process.platform === 'win32') {
        // Windows: Get drive letter from library path
        const driveLetter = path.parse(libraryPath).root.replace('\\', '');
        const output = execSync(`wmic logicaldisk where "DeviceID='${driveLetter}'" get Size,FreeSpace /format:csv`, { encoding: 'utf-8' });
        const lines = output.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
          const parts = lines[1].split(',');
          const freeSpace = parseInt(parts[1] || 0);
          const totalSpace = parseInt(parts[2] || 0);
          diskCapacity = {
            total: totalSpace,
            free: freeSpace,
            used: totalSpace - freeSpace
          };
        }
      } else {
        // Unix/Linux/Mac
        const output = execSync(`df -k "${libraryPath}" | tail -1`, { encoding: 'utf-8' });
        const parts = output.trim().split(/\s+/);
        const total = parseInt(parts[1]) * 1024; // Convert from KB to bytes
        const used = parseInt(parts[2]) * 1024;
        const free = parseInt(parts[3]) * 1024;
        diskCapacity = { total, used, free };
      }
    } catch (diskError) {
      console.error('Error getting disk capacity:', diskError);
    }

    res.json({
      photoLibraryPath: libraryPath,
      libraryExists,
      thumbnailPath: process.env.THUMBNAIL_PATH,
      dbPath: process.env.DB_PATH,
      diskCapacity
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

module.exports = router;
