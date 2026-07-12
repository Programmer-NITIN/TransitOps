const express = require('express');
const cors = require('cors');

const app = express();

// --------------- Middleware ---------------
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// --------------- Health Check ---------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Routes ---------------
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/vehicles', require('./modules/vehicles/vehicles.routes'));
app.use('/api/drivers', require('./modules/drivers/drivers.routes'));
app.use('/api/trips', require('./modules/trips/trips.routes'));
app.use('/api/maintenance', require('./modules/maintenance/maintenance.routes'));
app.use('/api/fuel-logs', require('./modules/expenses/fuelLogs.routes'));
app.use('/api/expenses', require('./modules/expenses/expenses.routes'));
app.use('/api/reports', require('./modules/reports/reports.routes'));

// --------------- Error Handler ---------------
app.use(require('./middleware/errorHandler'));

module.exports = app;
