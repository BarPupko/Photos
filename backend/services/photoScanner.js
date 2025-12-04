const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const exifParser = require('exif-parser');
const { prepare, saveDatabase } = require('../config/database');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

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

// Extract EXIF data from image
async function extractExifData(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);

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
    console.error(`Error extracting EXIF from ${filePath}:`, error);
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

    // Generate thumbnail using Jimp
    const image = await Jimp.read(filePath);
    await image
      .cover(300, 300)
      .quality(80)
      .writeAsync(thumbnailPath);

    return `/thumbnails/thumb_${filename}`;
  } catch (error) {
    console.error(`Error generating thumbnail for ${filePath}:`, error);
    return null;
  }
}

// Get image dimensions
async function getImageDimensions(filePath) {
  try {
    const image = await Jimp.read(filePath);
    return {
      width: image.bitmap.width,
      height: image.bitmap.height
    };
  } catch (error) {
    console.error(`Error getting dimensions for ${filePath}:`, error);
    return { width: null, height: null };
  }
}

// Process a single photo
async function processPhoto(filePath, thumbnailDir) {
  try {
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);

    // Extract EXIF data, fallback to file modification time
    let takenAt = await extractExifData(filePath);

    // If no EXIF date, use file modification time
    if (!takenAt) {
      takenAt = stats.mtime;
    }

    // Get image dimensions
    const { width, height } = await getImageDimensions(filePath);

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(filePath, thumbnailDir);

    // Check if photo already exists in database
    const existing = prepare('SELECT id FROM photos WHERE filepath = ?').get(filePath);

    if (existing) {
      // Update existing photo
      prepare(`
        UPDATE photos
        SET filename = ?, thumbnail_path = ?, file_size = ?, width = ?, height = ?,
            taken_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE filepath = ?
      `).run(
        filename,
        thumbnailPath,
        stats.size,
        width,
        height,
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
        thumbnailPath,
        stats.size,
        width,
        height,
        takenAt.toISOString()
      );
    }

    return { success: true, filepath: filePath };
  } catch (error) {
    console.error(`Error processing photo ${filePath}:`, error);
    return { success: false, filepath: filePath, error: error.message };
  }
}

// Scan photo library
async function scanPhotoLibrary(libraryPath, thumbnailDir) {
  console.log(`Starting photo library scan: ${libraryPath}`);

  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Photo library path does not exist: ${libraryPath}`);
  }

  // Scan for all image files
  const imageFiles = await scanDirectory(libraryPath);
  console.log(`Found ${imageFiles.length} images`);

  const results = {
    total: imageFiles.length,
    processed: 0,
    failed: 0,
    errors: []
  };

  // Process each image
  for (let i = 0; i < imageFiles.length; i++) {
    const result = await processPhoto(imageFiles[i], thumbnailDir);

    if (result.success) {
      results.processed++;
    } else {
      results.failed++;
      results.errors.push(result);
    }

    // Log progress every 10 images
    if ((i + 1) % 10 === 0 || (i + 1) === imageFiles.length) {
      console.log(`Progress: ${i + 1}/${imageFiles.length} images processed`);
    }
  }

  // Save database after all processing
  saveDatabase();

  console.log(`Scan complete. Processed: ${results.processed}, Failed: ${results.failed}`);

  return results;
}

module.exports = {
  scanPhotoLibrary,
  processPhoto
};
