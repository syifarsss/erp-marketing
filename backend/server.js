const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server (port 5173) and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static upload folders (for mock logos or download brochures)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Register Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/operators', require('./routes/operators'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/social', require('./routes/social'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/gsc', require('./routes/gsc'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notes', require('./routes/notes'));

// Base route status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', service: 'Marketing ERP API', time: new Date() });
});

// Database connection diagnostic route
app.get('/api/db-check', async (req, res) => {
  const { pool } = require('./config/db');
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM User');
    conn.release();
    res.json({
      status: 'connected',
      message: 'Database connection is successful and User table exists.',
      userCount: rows[0].count,
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'erp_marketing'
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      message: 'Database connection failed.',
      error: err.message,
      code: err.code,
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'erp_marketing'
      }
    });
  }
});

app.get('/api/diag', async (req, res) => {
  const { pool } = require('./config/db');
  try {
    const [prospectDesc] = await pool.query('DESCRIBE Prospect');
    const [clientDesc] = await pool.query('DESCRIBE Client');
    const [clientsDesc] = await pool.query('DESCRIBE clients');
    res.json({ Prospect: prospectDesc, Client: clientDesc, clients: clientsDesc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.', error: err.message });
});

// Initialize DB and start server
async function startServer() {
  let dbInitialized = false;
  try {
    await initializeDatabase();
    dbInitialized = true;
  } catch (err) {
    console.error('âš ï¸ Database initialization failed on startup:', err.message);
    console.error('The server will start anyway, but database queries might fail until connection issues are resolved.');
  }

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`ðŸš€ Server running on http://localhost:${PORT}`);
    if (dbInitialized) {
      console.log(`âœ“ Database initialized successfully.`);
    } else {
      console.log(`âš ï¸ Database is OFFLINE. The app will retry connection on demand.`);
    }
    console.log(`=========================================`);
  });
}

startServer();

