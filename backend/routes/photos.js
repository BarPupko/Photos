const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { prepare } = require("../config/database");
const Jimp = require("jimp");

// Increase Jimp memory limit for large images
Jimp.decoders["image/jpeg"] = (data) => {
  const jpeg = require("jpeg-js");
  return jpeg.decode(data, {
    maxMemoryUsageInMB: 1024,
    maxResolutionInMP: 600,
  });
};

// Get all photos (with pagination)
router.get("/", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Reduced from 1000 to 50
    const offset = (page - 1) * limit;

    const photos = prepare(`
      SELECT * FROM photos
      WHERE deleted_at IS NULL
      ORDER BY
        CASE WHEN taken_at IS NOT NULL THEN taken_at ELSE created_at END DESC,
        created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    // Get album information for each photo
    const photoIds = photos.map((p) => p.id);
    const albumsMap = {};

    if (photoIds.length > 0) {
      const albumData = prepare(`
        SELECT ap.photo_id, a.id, a.name
        FROM album_photos ap
        JOIN albums a ON ap.album_id = a.id
        WHERE ap.photo_id IN (${photoIds.map(() => "?").join(",")})
      `).all(...photoIds);

      albumData.forEach((row) => {
        if (!albumsMap[row.photo_id]) {
          albumsMap[row.photo_id] = [];
        }
        albumsMap[row.photo_id].push({ id: row.id, name: row.name });
      });
    }

    // Add albums to each photo
    photos.forEach((photo) => {
      photo.albums = albumsMap[photo.id] || [];
    });

    const total = prepare(
      "SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NULL"
    ).get();

    res.json({
      photos,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get trash photos - MUST come before /:id route
router.get("/trash", (req, res) => {
  try {
    const photos = prepare(`
      SELECT * FROM photos
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `).all();

    res.json({ photos });
  } catch (error) {
    console.error("Error fetching trash photos:", error);
    res.status(500).json({ error: "Failed to fetch trash photos" });
  }
});

// Get trash count - MUST come before /:id route
router.get("/trash/count", (req, res) => {
  try {
    const result = prepare(
      "SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NOT NULL"
    ).get();
    res.json({ count: result.count || 0 });
  } catch (error) {
    console.error("Error fetching trash count:", error);
    res.status(500).json({ error: "Failed to fetch trash count" });
  }
});

// Move photos to trash (soft delete - only marks as deleted)
router.post("/trash", (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: "Invalid photo IDs" });
    }

    let movedCount = 0;
    const errors = [];

    for (const photoId of photoIds) {
      try {
        const photo = prepare("SELECT * FROM photos WHERE id = ?").get(photoId);

        if (!photo) {
          errors.push({ photoId, error: "Photo not found" });
          continue;
        }

        // Only mark as deleted in database - don't move files yet
        prepare(`
          UPDATE photos
          SET deleted_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(photoId);

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
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error moving photos to trash:", error);
    res.status(500).json({ error: "Failed to move photos to trash" });
  }
});

// Restore photos from trash
router.post("/trash/restore", (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: "Invalid photo IDs" });
    }

    let restoredCount = 0;
    const errors = [];

    for (const photoId of photoIds) {
      try {
        const photo = prepare("SELECT * FROM photos WHERE id = ?").get(photoId);

        if (!photo) {
          errors.push({ photoId, error: "Photo not found" });
          continue;
        }

        // Restore by removing deleted_at timestamp
        prepare(`
          UPDATE photos
          SET deleted_at = NULL
          WHERE id = ?
        `).run(photoId);

        restoredCount++;
      } catch (error) {
        console.error(`Error restoring photo ${photoId}:`, error);
        errors.push({ photoId, error: error.message });
      }
    }

    res.json({
      success: true,
      restored: restoredCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error restoring photos:", error);
    res.status(500).json({ error: "Failed to restore photos" });
  }
});

// Permanently delete photos from trash
router.delete("/trash/permanent", (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: "Invalid photo IDs" });
    }

    let deletedCount = 0;
    const errors = [];

    for (const photoId of photoIds) {
      try {
        const photo = prepare(
          "SELECT * FROM photos WHERE id = ? AND deleted_at IS NOT NULL"
        ).get(photoId);

        if (!photo) {
          errors.push({ photoId, error: "Photo not found in trash" });
          continue;
        }

        // Delete physical files
        if (fs.existsSync(photo.filepath)) {
          fs.unlinkSync(photo.filepath);
        }

        // Delete thumbnail if it exists
        if (photo.thumbnail_path) {
          const thumbnailFullPath = path.join(
            __dirname,
            "..",
            photo.thumbnail_path
          );
          if (fs.existsSync(thumbnailFullPath)) {
            fs.unlinkSync(thumbnailFullPath);
          }
        }

        // Delete from database
        prepare("DELETE FROM photos WHERE id = ?").run(photoId);

        deletedCount++;
      } catch (error) {
        console.error(`Error permanently deleting photo ${photoId}:`, error);
        errors.push({ photoId, error: error.message });
      }
    }

    res.json({
      success: true,
      deleted: deletedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error permanently deleting photos:", error);
    res.status(500).json({ error: "Failed to permanently delete photos" });
  }
});

// Empty trash - permanently delete all trashed photos
router.delete("/trash/empty", (req, res) => {
  try {
    const photos = prepare(
      "SELECT * FROM photos WHERE deleted_at IS NOT NULL"
    ).all();

    let deletedCount = 0;
    const errors = [];

    for (const photo of photos) {
      try {
        // Delete physical files
        if (fs.existsSync(photo.filepath)) {
          fs.unlinkSync(photo.filepath);
        }

        // Delete thumbnail if it exists
        if (photo.thumbnail_path) {
          const thumbnailFullPath = path.join(
            __dirname,
            "..",
            photo.thumbnail_path
          );
          if (fs.existsSync(thumbnailFullPath)) {
            fs.unlinkSync(thumbnailFullPath);
          }
        }

        // Delete from database
        prepare("DELETE FROM photos WHERE id = ?").run(photo.id);

        deletedCount++;
      } catch (error) {
        console.error(`Error permanently deleting photo ${photo.id}:`, error);
        errors.push({ photoId: photo.id, error: error.message });
      }
    }

    res.json({
      success: true,
      deleted: deletedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error emptying trash:", error);
    res.status(500).json({ error: "Failed to empty trash" });
  }
});

// Get photo by ID
router.get("/:id", (req, res) => {
  try {
    const photo = prepare("SELECT * FROM photos WHERE id = ?").get(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    res.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ error: "Failed to fetch photo" });
  }
});

// Serve original photo file
router.get("/:id/image", (req, res) => {
  try {
    const photo = prepare("SELECT * FROM photos WHERE id = ?").get(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (!fs.existsSync(photo.filepath)) {
      return res.status(404).json({ error: "Photo file not found" });
    }

    res.sendFile(photo.filepath);
  } catch (error) {
    console.error("Error serving photo:", error);
    res.status(500).json({ error: "Failed to serve photo" });
  }
});

// Serve optimized photo with caching for faster loading in lightbox
router.get("/:id/optimized", async (req, res) => {
  try {
    const photo = prepare("SELECT * FROM photos WHERE id = ?").get(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (!fs.existsSync(photo.filepath)) {
      return res.status(404).json({ error: "Photo file not found" });
    }

    const maxSize = parseInt(req.query.maxSize) || 1500;

    // Cache optimized images to disk for instant loading
    const optimizedDir = path.join(__dirname, "..", "optimized");
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    const filename = path.basename(photo.filepath);
    const ext = path.extname(filename);
    const optimizedPath = path.join(
      optimizedDir,
      `opt_${photo.id}_${maxSize}${ext}.jpg`
    );

    // If optimized version exists, serve it immediately
    if (fs.existsSync(optimizedPath)) {
      return res.sendFile(optimizedPath);
    }

    // Generate and cache optimized version
    const image = await Jimp.read(photo.filepath);

    // Resize to small size for very fast loading
    const smallSize = 800; // Much smaller than before
    if (image.bitmap.width > smallSize || image.bitmap.height > smallSize) {
      image.scaleToFit(smallSize, smallSize);
    }

    // Use 50% quality for very fast loading and small file size
    await image.quality(50).writeAsync(optimizedPath);

    res.sendFile(optimizedPath);
  } catch (error) {
    console.error("Error serving optimized photo:", error);
    // Fallback to original image
    const photo = prepare("SELECT * FROM photos WHERE id = ?").get(
      req.params.id
    );
    if (photo && fs.existsSync(photo.filepath)) {
      res.sendFile(photo.filepath);
    } else {
      res.status(500).json({ error: "Failed to serve photo" });
    }
  }
});

// Generate thumbnail on-demand with caching
router.get("/:id/thumbnail", async (req, res) => {
  try {
    const photo = prepare("SELECT * FROM photos WHERE id = ?").get(
      req.params.id
    );

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    if (!fs.existsSync(photo.filepath)) {
      return res.status(404).json({ error: "Photo file not found" });
    }

    // Cache thumbnails to disk for instant loading
    const thumbnailDir = path.join(__dirname, "..", "thumbnails");
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const filename = path.basename(photo.filepath);
    const ext = path.extname(filename);
    const thumbnailPath = path.join(
      thumbnailDir,
      `thumb_${photo.id}${ext}.jpg`
    );

    // If thumbnail exists, serve it immediately with cache headers
    if (fs.existsSync(thumbnailPath)) {
      res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      return res.sendFile(thumbnailPath);
    }

    // Generate and cache thumbnail (optimized for speed)
    const image = await Jimp.read(photo.filepath);

    // Resize to very small size for fast loading
    if (image.bitmap.width > 200 || image.bitmap.height > 200) {
      image.scaleToFit(200, 200);
    }

    // Create 200x200 thumbnail with 20% quality (very fast, very small files)
    await image.cover(200, 200).quality(20).writeAsync(thumbnailPath);

    res.set("Cache-Control", "public, max-age=31536000");
    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    // Fallback to original image
    const photo = prepare("SELECT * FROM photos WHERE id = ?").get(
      req.params.id
    );
    if (photo && fs.existsSync(photo.filepath)) {
      res.sendFile(photo.filepath);
    } else {
      res.status(500).json({ error: "Failed to generate thumbnail" });
    }
  }
});

module.exports = router;
