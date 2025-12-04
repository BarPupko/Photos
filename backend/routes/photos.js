const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { prepare } = require('../config/database');

// Get all photos (with pagination)
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;

    const photos = prepare(`
      SELECT * FROM photos
      WHERE deleted_at IS NULL
      ORDER BY
        CASE WHEN taken_at IS NOT NULL THEN taken_at ELSE created_at END DESC,
        created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = prepare('SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NULL').get();

    res.json({
      photos,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get photo by ID
router.get('/:id', (req, res) => {
  try {
    const photo = prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Serve original photo file
router.get('/:id/image', (req, res) => {
  try {
    const photo = prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (!fs.existsSync(photo.filepath)) {
      return res.status(404).json({ error: 'Photo file not found' });
    }

    res.sendFile(photo.filepath);
  } catch (error) {
    console.error('Error serving photo:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
});

// Get trash photos
router.get('/trash', (req, res) => {
  try {
    const photos = prepare(`
      SELECT * FROM photos
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `).all();

    res.json({ photos });
  } catch (error) {
    console.error('Error fetching trash photos:', error);
    res.status(500).json({ error: 'Failed to fetch trash photos' });
  }
});

// Get trash count
router.get('/trash/count', (req, res) => {
  try {
    const result = prepare('SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NOT NULL').get();
    res.json({ count: result.count || 0 });
  } catch (error) {
    console.error('Error fetching trash count:', error);
    res.status(500).json({ error: 'Failed to fetch trash count' });
  }
});

// Move photos to trash
router.post('/trash', (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'Invalid photo IDs' });
    }

    const libraryPath = process.env.PHOTO_LIBRARY_PATH;
    const trashPath = path.join(libraryPath, '.trash');

    // Create trash folder if it doesn't exist
    if (!fs.existsSync(trashPath)) {
      fs.mkdirSync(trashPath, { recursive: true });
    }

    let movedCount = 0;
    const errors = [];

    for (const photoId of photoIds) {
      try {
        const photo = prepare('SELECT * FROM photos WHERE id = ?').get(photoId);

        if (!photo) {
          errors.push({ photoId, error: 'Photo not found' });
          continue;
        }

        if (!fs.existsSync(photo.filepath)) {
          errors.push({ photoId, error: 'Photo file not found' });
          continue;
        }

        // Move photo file to trash
        const filename = path.basename(photo.filepath);
        const trashFilePath = path.join(trashPath, filename);

        // Handle duplicate filenames in trash
        let finalTrashPath = trashFilePath;
        let counter = 1;
        while (fs.existsSync(finalTrashPath)) {
          const ext = path.extname(filename);
          const name = path.basename(filename, ext);
          finalTrashPath = path.join(trashPath, `${name}_${counter}${ext}`);
          counter++;
        }

        fs.renameSync(photo.filepath, finalTrashPath);

        // Move thumbnail to trash if it exists
        if (photo.thumbnail_path) {
          const thumbnailPath = path.join(process.env.THUMBNAIL_PATH || './thumbnails', path.basename(photo.thumbnail_path));
          if (fs.existsSync(thumbnailPath)) {
            const trashThumbnailPath = path.join(trashPath, `thumb_${path.basename(finalTrashPath)}`);
            fs.renameSync(thumbnailPath, trashThumbnailPath);
          }
        }

        // Update database - mark as deleted and store trash path
        prepare(`
          UPDATE photos
          SET filepath = ?, deleted_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(finalTrashPath, photoId);

        movedCount++;
      } catch (error) {
        console.error(`Error moving photo ${photoId} to trash:`, error);
        errors.push({ photoId, error: error.message });
      }
    }

    res.json({
      success: true,
      moved: movedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error moving photos to trash:', error);
    res.status(500).json({ error: 'Failed to move photos to trash' });
  }
});

module.exports = router;
