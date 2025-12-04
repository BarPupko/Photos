const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './database/photos.db';
const dbDir = path.dirname(dbPath);

// Create database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize database schema
  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL UNIQUE,
      thumbnail_path TEXT,
      file_size INTEGER,
      width INTEGER,
      height INTEGER,
      taken_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_taken_at ON photos(taken_at);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON photos(created_at);`);

  // Add deleted_at column if it doesn't exist (for existing databases)
  try {
    db.run(`ALTER TABLE photos ADD COLUMN deleted_at DATETIME;`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Save database to file
  saveDatabase();

  return db;
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Wrapper functions to match better-sqlite3 API
function prepare(sql) {
  return {
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    run: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      saveDatabase();
      return { changes: db.getRowsModified() };
    }
  };
}

module.exports = {
  initDatabase,
  prepare,
  saveDatabase
};
