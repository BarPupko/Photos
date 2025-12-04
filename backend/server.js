require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve thumbnails as static files
app.use('/thumbnails', express.static(path.join(__dirname, process.env.THUMBNAIL_PATH || 'thumbnails')));

// Routes
app.use('/api/photos', require('./routes/photos'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/config', require('./routes/config'));
app.use('/api/scan', require('./routes/scan'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Photo Library API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
