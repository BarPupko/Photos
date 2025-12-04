const express = require('express');
const router = express.Router();
const { prepare, saveDatabase } = require('../config/database');

// Get all albums
router.get('/', (req, res) => {
  try {
    const albums = prepare(`
      SELECT
        a.*,
        COUNT(DISTINCT ap.photo_id) as photo_count,
        p.thumbnail_path as cover_thumbnail
      FROM albums a
      LEFT JOIN album_photos ap ON a.id = ap.album_id
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      GROUP BY a.id
      ORDER BY a.updated_at DESC
    `).all();

    res.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get single album with photos
router.get('/:id', (req, res) => {
  try {
    const album = prepare('SELECT * FROM albums WHERE id = ?').get(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const photos = prepare(`
      SELECT p.*, ap.added_at
      FROM photos p
      INNER JOIN album_photos ap ON p.id = ap.photo_id
      WHERE ap.album_id = ? AND p.deleted_at IS NULL
      ORDER BY ap.added_at DESC
    `).all(req.params.id);

    res.json({ album, photos });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Create new album
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Album name is required' });
    }

    prepare(`
      INSERT INTO albums (name, description)
      VALUES (?, ?)
    `).run(name.trim(), description || null);

    const newAlbum = prepare('SELECT * FROM albums WHERE id = last_insert_rowid()').get();

    res.json({ success: true, album: newAlbum });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album
router.put('/:id', (req, res) => {
  try {
    const { name, description, cover_photo_id } = req.body;
    const albumId = req.params.id;

    const album = prepare('SELECT * FROM albums WHERE id = ?').get(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    prepare(`
      UPDATE albums
      SET name = ?, description = ?, cover_photo_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name || album.name, description !== undefined ? description : album.description, cover_photo_id || null, albumId);

    const updatedAlbum = prepare('SELECT * FROM albums WHERE id = ?').get(albumId);

    res.json({ success: true, album: updatedAlbum });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Delete album
router.delete('/:id', (req, res) => {
  try {
    const album = prepare('SELECT * FROM albums WHERE id = ?').get(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Delete album (cascade will handle album_photos)
    prepare('DELETE FROM albums WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Add photos to album
router.post('/:id/photos', (req, res) => {
  try {
    const { photoIds } = req.body;
    const albumId = req.params.id;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'Invalid photo IDs' });
    }

    const album = prepare('SELECT * FROM albums WHERE id = ?').get(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    let addedCount = 0;
    const errors = [];

    for (const photoId of photoIds) {
      try {
        // Check if photo exists
        const photo = prepare('SELECT * FROM photos WHERE id = ? AND deleted_at IS NULL').get(photoId);
        if (!photo) {
          errors.push({ photoId, error: 'Photo not found' });
          continue;
        }

        // Check if photo is already in album
        const existing = prepare('SELECT * FROM album_photos WHERE album_id = ? AND photo_id = ?').get(albumId, photoId);
        if (existing) {
          errors.push({ photoId, error: 'Photo already in album' });
          continue;
        }

        // Add photo to album
        prepare(`
          INSERT INTO album_photos (album_id, photo_id)
          VALUES (?, ?)
        `).run(albumId, photoId);

        addedCount++;
      } catch (error) {
        console.error(`Error adding photo ${photoId} to album:`, error);
        errors.push({ photoId, error: error.message });
      }
    }

    // Update album's updated_at timestamp
    prepare('UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(albumId);

    // Set cover photo if album doesn't have one
    if (!album.cover_photo_id && addedCount > 0) {
      prepare('UPDATE albums SET cover_photo_id = ? WHERE id = ?').run(photoIds[0], albumId);
    }

    res.json({
      success: true,
      added: addedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error adding photos to album:', error);
    res.status(500).json({ error: 'Failed to add photos to album' });
  }
});

// Remove photos from album
router.delete('/:id/photos', (req, res) => {
  try {
    const { photoIds } = req.body;
    const albumId = req.params.id;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'Invalid photo IDs' });
    }

    const album = prepare('SELECT * FROM albums WHERE id = ?').get(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    let removedCount = 0;

    for (const photoId of photoIds) {
      prepare('DELETE FROM album_photos WHERE album_id = ? AND photo_id = ?').run(albumId, photoId);
      removedCount++;
    }

    // Update album's updated_at timestamp
    prepare('UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(albumId);

    // Update cover photo if it was removed
    if (photoIds.includes(album.cover_photo_id)) {
      const firstPhoto = prepare('SELECT photo_id FROM album_photos WHERE album_id = ? LIMIT 1').get(albumId);
      prepare('UPDATE albums SET cover_photo_id = ? WHERE id = ?').run(firstPhoto?.photo_id || null, albumId);
    }

    res.json({ success: true, removed: removedCount });
  } catch (error) {
    console.error('Error removing photos from album:', error);
    res.status(500).json({ error: 'Failed to remove photos from album' });
  }
});

module.exports = router;
