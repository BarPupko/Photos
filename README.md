# Photo Library

A Google Photos-like web application for browsing your personal photo library in a timeline view.

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (sql.js)
- **Image Processing**: Jimp (for thumbnails)

## Project Structure

```
photo-library/
├── backend/              # Express API server
│   ├── config/          # Database configuration
│   ├── routes/          # API routes
│   ├── .env            # Environment variables
│   └── server.js       # Main server file
├── frontend/            # Vue 3 application
│   ├── src/
│   │   ├── views/      # Page components
│   │   ├── router/     # Vue Router
│   │   ├── App.vue     # Root component
│   │   └── main.js     # App entry point
│   └── index.html
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

From the root directory:

```bash
npm run install:all
```

Or manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Photo Library Path

Edit `backend/.env` and set your photo library path:

```env
PORT=3000
PHOTO_LIBRARY_PATH=C:/Users/YourUsername/Pictures
THUMBNAIL_PATH=./thumbnails
DB_PATH=./database/photos.db
```

**Important**: Update `PHOTO_LIBRARY_PATH` to point to your actual photos directory.

### 3. Run the Application

From the root directory:

```bash
npm run dev
```

This will start both the backend and frontend servers concurrently:
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## Development Phases

### Phase 1: Foundation & Setup ✅
- [x] Project structure
- [x] Basic frontend with Vue 3
- [x] Backend API with Express
- [x] SQLite database setup
- [x] Configuration for photo library path

### Phase 2: Photo Library Scanning ✅
- [x] Scan photo library directory recursively
- [x] Extract EXIF metadata (dates, dimensions)
- [x] Generate thumbnails using Jimp
- [x] Store photo information in database
- [x] Scan endpoint with status polling
- [x] Frontend scan button and progress display

### Phase 3: Timeline View ✅
- [x] Display photos chronologically
- [x] Group by date (year/month/day)
- [x] Friendly date labels (Today, Yesterday, dates)
- [x] Photo count per date group
- [x] File modification time fallback for dates

### Phase 4: Navigation & UI Polish ✅
- [x] Photo viewer/lightbox for full-size viewing
- [x] Photo metadata display (filename, date, dimensions)
- [x] Responsive design for mobile/tablet
- [x] Photo count in date headers
- [x] Improved UI and animations

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/config` - Get current configuration
- `GET /api/photos` - Get all photos (with pagination)
- `GET /api/photos/:id` - Get photo by ID
- `GET /api/photos/:id/image` - Serve original photo file
- `POST /api/scan/start` - Start photo library scan
- `GET /api/scan/status` - Get scan status and results

## How to Use

1. **First time setup**: Edit [backend/.env](backend/.env) to set your `PHOTO_LIBRARY_PATH`
2. **Run the app**: `npm run dev`
3. **Open browser**: Go to http://localhost:5173
4. **Scan your library**: Click "Scan Library" button to index your photos
5. **View photos**: Browse your photos in the timeline view

## Features

- ✅ Recursive directory scanning for images
- ✅ Automatic thumbnail generation
- ✅ EXIF metadata extraction with file date fallback
- ✅ SQLite database for fast queries
- ✅ Real-time scan progress with polling
- ✅ Timeline view with date grouping (Today, Yesterday, dates)
- ✅ Photo count per date group
- ✅ Full-size photo viewer/lightbox
- ✅ Photo metadata display (filename, date, dimensions)
- ✅ Responsive design for all screen sizes
- ✅ Support for JPG, PNG, GIF, BMP, WebP
- ✅ Hover effects and smooth animations
