const express = require("express");
const router = express.Router();
const path = require("path");
const {
  scanPhotoLibrary,
  quickScanPhotoLibrary,
} = require("../services/photoScanner");

let isScanning = false;
let lastScanResult = null;

// Quick scan on startup (no thumbnails)
async function autoScanOnStartup() {
  const libraryPath = process.env.PHOTO_LIBRARY_PATH;
  const thumbnailDir = path.join(
    __dirname,
    "..",
    process.env.THUMBNAIL_PATH || "thumbnails"
  );

  if (!libraryPath) {
    console.log("PHOTO_LIBRARY_PATH not configured, skipping auto-scan");
    return;
  }

  console.log("Starting automatic background scan (without thumbnails)...");
  try {
    const result = await quickScanPhotoLibrary(libraryPath, thumbnailDir);
    console.log(
      `Auto-scan complete: ${result.new} new, ${result.updated} updated, ${result.skipped} skipped`
    );
  } catch (error) {
    console.error("Auto-scan error:", error);
  }
}

// Auto-scan disabled by default - users can enable with AUTO_SCAN=true in .env
// if (process.env.AUTO_SCAN === 'true') {
//   setTimeout(() => autoScanOnStartup(), 2000); // Wait 2 seconds after server starts
// }

// Start photo library scan
router.post("/start", async (req, res) => {
  if (isScanning) {
    return res.status(409).json({
      error: "Scan already in progress",
      isScanning: true,
    });
  }

  const libraryPath = process.env.PHOTO_LIBRARY_PATH;
  const thumbnailDir = path.join(
    __dirname,
    "..",
    process.env.THUMBNAIL_PATH || "thumbnails"
  );
  const skipThumbnails = req.body.skipThumbnails || false;

  if (!libraryPath) {
    return res.status(400).json({
      error: "PHOTO_LIBRARY_PATH not configured",
    });
  }

  // Start scan in background
  isScanning = true;
  res.json({
    message: "Photo library scan started",
    libraryPath,
    isScanning: true,
  });

  try {
    const result = skipThumbnails
      ? await quickScanPhotoLibrary(libraryPath, thumbnailDir)
      : await scanPhotoLibrary(libraryPath, thumbnailDir);
    lastScanResult = {
      ...result,
      completedAt: new Date().toISOString(),
    };
    isScanning = false;
  } catch (error) {
    console.error("Scan error:", error);
    lastScanResult = {
      error: error.message,
      completedAt: new Date().toISOString(),
    };
    isScanning = false;
  }
});

// Get scan status
router.get("/status", (req, res) => {
  res.json({
    isScanning,
    lastScanResult,
  });
});

module.exports = router;
