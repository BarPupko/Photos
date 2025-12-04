# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Google Photos-like web application for browsing personal photo libraries in a timeline view. This is a monorepo with separate backend (Node.js/Express) and frontend (Vue 3) applications.

**Tech Stack:**
- Backend: Node.js, Express, SQLite (sql.js), Jimp (image processing)
- Frontend: Vue 3 (Composition API), Vite, Axios
- Database: SQLite with in-memory sql.js wrapper

## Development Commands

### Setup
```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all

# Or install individually
npm install           # Root dependencies (concurrently)
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application
```bash
# Run both backend and frontend concurrently (recommended)
npm run dev

# Or run separately
npm run dev:backend   # Starts backend on http://localhost:3000
npm run dev:frontend  # Starts frontend on http://localhost:5173
```

### Backend Development
```bash
cd backend
npm run dev     # Uses nodemon for auto-reload
npm start       # Production mode
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development server with HMR
npm run build    # Production build
npm run preview  # Preview production build
```

## Configuration

Backend configuration is in `backend/.env`:
- `PORT`: Backend API port (default: 3000)
- `PHOTO_LIBRARY_PATH`: Absolute path to photo directory (REQUIRED)
- `THUMBNAIL_PATH`: Relative path for generated thumbnails (default: ./thumbnails)
- `DB_PATH`: SQLite database file location (default: ./database/photos.db)

**Important:** On Windows, use double backslashes in paths (e.g., `C:\\Users\\...`) or forward slashes.

## Architecture

### Backend Architecture

**Database Layer** ([backend/config/database.js](backend/config/database.js)):
- Uses sql.js (WebAssembly SQLite) instead of native SQLite
- Database is loaded into memory and periodically saved to disk
- Provides wrapper functions (`prepare()`) that mimic better-sqlite3 API
- Schema includes soft deletes via `deleted_at` column

**Photo Scanner** ([backend/services/photoScanner.js](backend/services/photoScanner.js)):
- Recursively scans directories for images (.jpg, .jpeg, .png, .gif, .bmp, .webp)
- Extracts EXIF metadata (DateTimeOriginal) using exif-parser
- Falls back to file modification time if no EXIF data exists
- Generates 300x300 thumbnails using Jimp with 80% quality
- Updates existing photos or inserts new ones based on filepath uniqueness
- Runs synchronously but reports progress every 10 images

**API Routes:**
- `/api/photos` - GET: Fetch photos with pagination, ordered by taken_at/created_at DESC
- `/api/photos/:id` - GET: Single photo metadata
- `/api/photos/:id/image` - GET: Serve original photo file
- `/api/photos/trash` - GET: Fetch deleted photos, POST: Move photos to trash
- `/api/photos/trash/count` - GET: Count of trashed photos
- `/api/scan/start` - POST: Initiate library scan (returns immediately, scan runs in background)
- `/api/scan/status` - GET: Check scan progress and results
- `/api/config` - GET: Current configuration

**Trash System:**
- Photos are moved to `.trash` folder within `PHOTO_LIBRARY_PATH`
- Database marks photos with `deleted_at` timestamp and updates filepath
- Both photo files and thumbnails are moved to trash
- Handles duplicate filenames in trash by appending counter

### Frontend Architecture

**Single Page Application:**
- Main component: [frontend/src/views/Photos.vue](frontend/src/views/Photos.vue)
- Uses Vue Router but currently only has one route
- All state management done with Vue 3 Composition API (ref/computed)

**Key Features:**
- **Timeline View**: Groups photos by date with "Today", "Yesterday", and formatted dates
- **Lightbox**: Full-size photo viewer with keyboard navigation and metadata panel
- **Selection Mode**: Multi-select photos with checkboxes, bulk operations (trash)
- **Timeline Navigation**: Right sidebar with years and month density dots
- **Left Sidebar**: Navigation (Photos/Trash) and storage info
- **Scan Polling**: Frontend polls `/api/scan/status` every 2 seconds during scan

**Photo Grouping Logic:**
- Photos sorted by `taken_at` (or `created_at` as fallback) in descending order
- Grouped by ISO date (YYYY-MM-DD)
- Labels computed as "Today", "Yesterday", or formatted date

**API Communication:**
- Base URL: `http://localhost:3000` (proxied by Vite in dev)
- Uses Axios for all HTTP requests
- No global state management - all state local to Photos.vue

## Common Development Scenarios

### Adding Support for New Image Formats
1. Add extension to `IMAGE_EXTENSIONS` array in [backend/services/photoScanner.js:8](backend/services/photoScanner.js#L8)
2. Verify Jimp supports the format (or add appropriate library)

### Modifying Database Schema
1. Update schema in [backend/config/database.js:28-42](backend/config/database.js#L28-L42)
2. Consider migration logic for existing databases (see `ALTER TABLE` pattern at line 48)
3. Update SQL queries in routes and services to use new fields

### Changing Thumbnail Generation
- Thumbnail size/quality configured in [backend/services/photoScanner.js:79-82](backend/services/photoScanner.js#L79-L82)
- Current: 300x300 cover crop at 80% quality
- Modify Jimp chain to change behavior

### Adding New API Endpoints
1. Create route file in `backend/routes/` or add to existing route file
2. Register route in [backend/server.js:18-20](backend/server.js#L18-L20)
3. Use `prepare()` helper from database module for queries
4. Call `saveDatabase()` after write operations

### UI Components and Styling
- All styles are scoped to Photos.vue component
- Uses inline SVG icons (no icon library)
- Google Photos-inspired design with specific color palette:
  - Primary blue: #1a73e8
  - Text: #202124 (dark), #5f6368 (medium), #80868b (light)
  - Borders: #dadce0, #e8eaed
- Responsive breakpoints at 768px and 480px

## Important Implementation Details

### SQL.js Quirks
- Unlike better-sqlite3, sql.js requires manual database saves
- `saveDatabase()` must be called after any write operation
- Prepared statements must be explicitly freed (handled by wrappers)
- Statement binding is 0-indexed, not 1-indexed like in native SQLite

### Scan Process Flow
1. POST to `/api/scan/start` returns immediately with 202-like response
2. Scan runs asynchronously, stores result in `lastScanResult` variable
3. Frontend polls `/api/scan/status` every 2 seconds
4. When `isScanning` becomes false, scan is complete
5. Frontend refreshes photo list after successful scan

### Scan Optimization Strategy
- **Incremental scanning**: Only processes new or modified files
- Compares file size and modification time against database records
- Skips files that haven't changed since last scan
- Uses batch database saves (every 50 photos) for performance
- Typical rescan of 90k images: ~few seconds (vs hours for full reprocess)
- Progress reporting shows: new, updated, and skipped counts

### Photo File Serving
- Original photos served via Express static file route (`res.sendFile()`)
- Thumbnails served via Express static middleware on `/thumbnails` route
- Frontend uses thumbnail paths from database for grid view
- Full-size images fetched via `/api/photos/:id/image` for lightbox

### State Management Pattern
- No Vuex/Pinia - all state in component refs
- `selectedPhotos` uses Set for O(1) lookups
- Force reactivity updates on Set/Map by reassigning: `selectedPhotos.value = new Set(selectedPhotos.value)`

### Windows Path Handling
- Backend uses Node.js `path` module for cross-platform compatibility
- `.env` file requires escaped backslashes on Windows
- File operations use `fs` module which handles platform differences
