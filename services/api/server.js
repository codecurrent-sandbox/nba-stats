import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: uptime
  });
});

// Basic API endpoints (placeholder)
app.get('/api/v1/players', (req, res) => {
  res.json({
    data: [],
    total: 0,
    limit: req.query.limit || 20,
    offset: req.query.offset || 0
  });
});

app.get('/api/v1/teams', (req, res) => {
  res.json({
    data: [],
    total: 0,
    limit: req.query.limit || 20,
    offset: req.query.offset || 0
  });
});

app.get('/api/v1/games', (req, res) => {
  res.json({
    data: [],
    total: 0,
    limit: req.query.limit || 20,
    offset: req.query.offset || 0
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NBA Stats API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
