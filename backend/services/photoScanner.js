const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const exifParser = require("exif-parser");
const { prepare, saveDatabase } = require("../config/database");

// Increase Jimp memory limit for large images (default is 512MB)
Jimp.decoders["image/jpeg"] = (data) => {
  const jpeg = require("jpeg-js");
  return jpeg.decode(data, {
    maxMemoryUsageInMB: 1024,
    maxResolutionInMP: 600,
  });
};

// Supported image extensions
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

// Parallel processing configuration
const CONCURRENT_IMAGES = 20; // Process 20 images at once
const BATCH_SIZE = 500; // Save database every 500 images

// Recursively scan directory for images
async function scanDirectory(dirPath, baseDir = dirPath) {
  const files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (IMAGE_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return files;
}

// Extract EXIF data from image (optimized - only read first 64KB)
async function extractExifData(filePath) {
  try {
    // Only read first 64KB of file (EXIF is always at the start)
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(65536); // 64KB
    fs.readSync(fd, buffer, 0, 65536, 0);
    fs.closeSync(fd);

    // Try to parse EXIF data
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();

      if (result.tags && result.tags.DateTimeOriginal) {
        return new Date(result.tags.DateTimeOriginal * 1000);
      }
    } catch (exifError) {
      // EXIF parsing failed, will use file stats instead
    }
  } catch (error) {
    // Silently fail - we'll use file mtime
  }

  return null;
}

// Generate thumbnail for image
async function generateThumbnail(filePath, thumbnailDir) {
  try {
    const filename = path.basename(filePath);
    const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);

    // Skip if thumbnail already exists
    if (fs.existsSync(thumbnailPath)) {
      return `/thumbnails/thumb_${filename}`;
    }

    // Create thumbnail directory if it doesn't exist
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    // Generate thumbnail using Jimp with increased memory limit
    const image = await Jimp.read(filePath);

    // For very large images, resize to reasonable size first before creating thumbnail
    const MAX_DIMENSION = 4000; // Max width or height before resizing
    if (
      image.bitmap.width > MAX_DIMENSION ||
      image.bitmap.height > MAX_DIMENSION
    ) {
      // Scale down large images first to avoid memory issues
      image.scaleToFit(MAX_DIMENSION, MAX_DIMENSION);
    }

    await image.cover(300, 300).quality(80).writeAsync(thumbnailPath);

    return `/thumbnails/thumb_${filename}`;
  } catch (error) {
    console.error(`Error generating thumbnail for ${filePath}:`, error);
    return null;
  }
}

// Get image dimensions (only when needed)
async function getImageDimensions(filePath) {
  try {
    const image = await Jimp.read(filePath);
    return {
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
  } catch (error) {
    return { width: null, height: null };
  }
}

// Process a single photo (optimized for bulk import)
async function processPhoto(
  filePath,
  thumbnailDir,
  skipThumbnail = false,
  skipDimensions = false,
  skipExif = false
) {
  try {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);

    // Check if photo already exists in database
    const existing = prepare(
      "SELECT id, width, height, taken_at, thumbnail_path FROM photos WHERE filepath = ?"
    ).get(filePath);

    let width = existing?.width || null;
    let height = existing?.height || null;
    let takenAt = existing?.taken_at ? new Date(existing.taken_at) : null;
    let thumbnailPath = existing?.thumbnail_path || null;

    // Skip EXIF during bulk import for speed - use file modified date
    if (!skipExif && !takenAt) {
      takenAt = await extractExifData(filePath);
      if (!takenAt) {
        takenAt = stats.mtime;
      }
    } else if (!takenAt) {
      // During bulk import, just use file modified time
      takenAt = stats.mtime;
    }

    // Skip dimensions during bulk import (too slow)
    // Dimensions will be loaded on-demand when viewing photos
    if (!skipDimensions && (!width || !height)) {
      const dims = await getImageDimensions(filePath);
      width = dims.width || null;
      height = dims.height || null;
    }

    // Skip thumbnail generation during bulk import
    // Thumbnails will be generated on-demand when viewing photos
    if (
      !skipThumbnail &&
      (!thumbnailPath ||
        !fs.existsSync(path.join(thumbnailDir, path.basename(thumbnailPath))))
    ) {
      thumbnailPath = await generateThumbnail(filePath, thumbnailDir);
    }

    if (existing) {
      // Update existing photo
      prepare(`
        UPDATE photos
        SET filename = ?, thumbnail_path = ?, file_size = ?, width = ?, height = ?,
            taken_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE filepath = ?
      `).run(
        filename,
        thumbnailPath || null,
        stats.size,
        width || null,
        height || null,
        takenAt.toISOString(),
        filePath
      );
    } else {
      // Insert new photo
      prepare(`
        INSERT INTO photos (filename, filepath, thumbnail_path, file_size, width, height, taken_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        filename,
        filePath,
        thumbnailPath || null,
        stats.size,
        width || null,
        height || null,
        takenAt.toISOString()
      );
    }

    return { success: true, filepath: filePath };
  } catch (error) {
    console.error(`Error processing photo ${filePath}:`, error);
    return { success: false, filepath: filePath, error: error.message };
  }
}

// Check if photo needs processing (new or modified)
function needsProcessing(filePath, stats, existingPhoto) {
  if (!existingPhoto) {
    return true; // New file
  }

  // Check if file size changed (indicates modification)
  if (existingPhoto.file_size !== stats.size) {
    return true;
  }

  // Check if file was modified after last scan
  const fileModTime = stats.mtime.getTime();
  const dbUpdateTime = new Date(existingPhoto.updated_at).getTime();

  if (fileModTime > dbUpdateTime) {
    return true;
  }

  return false; // File hasn't changed
}

// Scan photo library
async function scanPhotoLibrary(libraryPath, thumbnailDir) {
  console.log(`Starting photo library scan: ${libraryPath}`);

  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Photo library path does not exist: ${libraryPath}`);
  }

  // Scan for all image files
  console.log("Scanning directory for images...");
  const imageFiles = await scanDirectory(libraryPath);
  console.log(`Found ${imageFiles.length} images`);

  // Get all existing photos from database for quick lookup
  console.log("Loading existing photos from database...");
  const existingPhotos = prepare(
    "SELECT filepath, file_size, updated_at FROM photos WHERE deleted_at IS NULL"
  ).all();
  const existingPhotosMap = new Map();
  existingPhotos.forEach((photo) => {
    existingPhotosMap.set(photo.filepath, photo);
  });
  console.log(`Found ${existingPhotos.length} existing photos in database`);

  // Filter files that need processing
  const filesToProcess = [];
  const skippedFiles = [];

  console.log("Checking which files need processing...");
  for (const filePath of imageFiles) {
    try {
      const stats = fs.statSync(filePath);
      const existing = existingPhotosMap.get(filePath);

      if (needsProcessing(filePath, stats, existing)) {
        filesToProcess.push(filePath);
      } else {
        skippedFiles.push(filePath);
      }
    } catch (error) {
      console.error(`Error checking file ${filePath}:`, error);
      filesToProcess.push(filePath); // Process it anyway if we can't check
    }
  }

  console.log(`Files to process: ${filesToProcess.length}`);
  console.log(`Files skipped (already up-to-date): ${skippedFiles.length}`);

  const results = {
    total: imageFiles.length,
    processed: 0,
    skipped: skippedFiles.length,
    failed: 0,
    errors: [],
    new: 0,
    updated: 0,
  };

  // Process images in parallel batches for MUCH faster performance
  console.log(
    `Processing ${filesToProcess.length} images with ${CONCURRENT_IMAGES} parallel workers...`
  );

  for (let i = 0; i < filesToProcess.length; i += CONCURRENT_IMAGES) {
    const batch = filesToProcess.slice(i, i + CONCURRENT_IMAGES);

    // Process batch in parallel - skip thumbnails, dimensions, AND EXIF for speed
    const batchResults = await Promise.all(
      batch.map((filePath) =>
        processPhoto(filePath, thumbnailDir, true, true, true)
      )
    );

    // Update results
    for (let j = 0; j < batchResults.length; j++) {
      const filePath = batch[j];
      const result = batchResults[j];
      const wasExisting = existingPhotosMap.has(filePath);

      if (result.success) {
        results.processed++;
        if (wasExisting) {
          results.updated++;
        } else {
          results.new++;
        }
      } else {
        results.failed++;
        results.errors.push(result);
      }
    }

    // Save database periodically in batches
    if ((i + CONCURRENT_IMAGES) % BATCH_SIZE === 0) {
      saveDatabase();
    }

    // Log progress
    const processed = Math.min(i + CONCURRENT_IMAGES, filesToProcess.length);
    console.log(
      `Progress: ${processed}/${filesToProcess.length} images processed (${results.new} new, ${results.updated} updated, ${results.skipped} skipped)`
    );
  }

  // Final database save
  saveDatabase();

  console.log(`Scan complete!`);
  console.log(`Total: ${results.total} images`);
  console.log(`New: ${results.new}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);

  return results;
}

// Quick scan photo library (no thumbnails - FAST!)
async function quickScanPhotoLibrary(libraryPath, thumbnailDir) {
  console.log(`Starting QUICK photo library scan: ${libraryPath}`);

  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Photo library path does not exist: ${libraryPath}`);
  }

  // Scan for all image files
  console.log("Scanning directory for images...");
  const imageFiles = await scanDirectory(libraryPath);
  console.log(`Found ${imageFiles.length} images`);

  // Get all existing photos from database for quick lookup
  console.log("Loading existing photos from database...");
  const existingPhotos = prepare(
    "SELECT filepath, file_size, updated_at FROM photos WHERE deleted_at IS NULL"
  ).all();
  const existingPhotosMap = new Map();
  existingPhotos.forEach((photo) => {
    existingPhotosMap.set(photo.filepath, photo);
  });
  console.log(`Found ${existingPhotos.length} existing photos in database`);

  // Filter files that need processing
  const filesToProcess = [];
  const skippedFiles = [];

  console.log("Checking which files need processing...");
  for (const filePath of imageFiles) {
    try {
      const stats = fs.statSync(filePath);
      const existing = existingPhotosMap.get(filePath);

      if (needsProcessing(filePath, stats, existing)) {
        filesToProcess.push(filePath);
      } else {
        skippedFiles.push(filePath);
      }
    } catch (error) {
      console.error(`Error checking file ${filePath}:`, error);
      filesToProcess.push(filePath); // Process it anyway if we can't check
    }
  }

  console.log(`Files to process: ${filesToProcess.length}`);
  console.log(`Files skipped (already up-to-date): ${skippedFiles.length}`);

  const results = {
    total: imageFiles.length,
    processed: 0,
    skipped: skippedFiles.length,
    failed: 0,
    errors: [],
    new: 0,
    updated: 0,
  };

  // Process images in parallel batches WITHOUT thumbnails or dimensions (SUPER FAST!)
  console.log(
    `Quick processing ${filesToProcess.length} images with ${CONCURRENT_IMAGES} parallel workers...`
  );

  for (let i = 0; i < filesToProcess.length; i += CONCURRENT_IMAGES) {
    const batch = filesToProcess.slice(i, i + CONCURRENT_IMAGES);

    // Process batch in parallel (skip thumbnails AND dimensions)
    const batchResults = await Promise.all(
      batch.map((filePath) => processPhoto(filePath, thumbnailDir, true, true))
    );

    // Update results
    for (let j = 0; j < batchResults.length; j++) {
      const filePath = batch[j];
      const result = batchResults[j];
      const wasExisting = existingPhotosMap.has(filePath);

      if (result.success) {
        results.processed++;
        if (wasExisting) {
          results.updated++;
        } else {
          results.new++;
        }
      } else {
        results.failed++;
        results.errors.push(result);
      }
    }

    // Save database periodically in batches
    if ((i + CONCURRENT_IMAGES) % BATCH_SIZE === 0) {
      saveDatabase();
    }

    // Log progress
    const processed = Math.min(i + CONCURRENT_IMAGES, filesToProcess.length);
    console.log(
      `Progress: ${processed}/${filesToProcess.length} images processed (${results.new} new, ${results.updated} updated, ${results.skipped} skipped)`
    );
  }

  // Final database save
  saveDatabase();

  console.log(`Quick scan complete!`);
  console.log(`Total: ${results.total} images`);
  console.log(`New: ${results.new}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);

  return results;
}

module.exports = {
  scanPhotoLibrary,
  quickScanPhotoLibrary,
  processPhoto,
};
