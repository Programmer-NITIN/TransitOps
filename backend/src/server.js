require('dotenv').config();
const { validateEnv, PORT } = require('./config/env');
const { pool } = require('./config/db');

// Validate env before anything else
validateEnv();

const app = require('./app');

async function start() {
  try {
    // Verify DB connection
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ Database connected at ${result.rows[0].now}`);

    app.listen(PORT, () => {
      console.log(`🚀 TransitOps API running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
