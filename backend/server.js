require('dotenv').config();
require('express-async-errors');

// Fail fast with a clear message instead of letting a missing var surface
// later as a cryptic error deep inside the Supabase SDK or jsonwebtoken.
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`✗ Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
  console.error('  Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

const express = require('express');
const morgan = require('morgan');
const os = require('os');

const app = require('./src/app');
const cacheService = require('./src/services/cacheService');
const supabase = require('./src/config/supabase');
const { logger } = require('./src/services/loggerService');

// Last-resort safety net for errors outside the Express request cycle
// (e.g. a fire-and-forget promise). Errors *inside* a request already go
// through asyncHandler + errorHandler and never reach here. Node's default
// since v15 is to crash on an unhandled rejection anyway — log with full
// context first, then exit so a process manager (pm2/systemd) can restart
// cleanly rather than continuing in a possibly-corrupted state.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { error: reason?.message || reason, stack: reason?.stack });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// CORS is configured once, inside src/app.js, before any route is registered —
// registering it again here (after app.js's routes and error handler are
// already in the middleware stack) would only apply to routes added below,
// not to the API responses that matter.
app.use(morgan('combined'));

// Improvement 16: Enhanced Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();

    // Test database connectivity
    let dbConnected = false;
    try {
      const { error } = await supabase.from('users').select('count', { count: 'exact' });
      dbConnected = !error;
    } catch (e) {
      dbConnected = false;
    }

    // Test cache connectivity
    const cacheConnected = cacheService.isConnected();

    // Determine overall status
    let status = 'healthy';
    if (!dbConnected && !cacheConnected) {
      status = 'critical';
    } else if (!dbConnected || !cacheConnected) {
      status = 'degraded';
    }

    res.status(status === 'critical' ? 503 : 200).json({
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime,
      connectivity: {
        database: dbConnected,
        cache: cacheConnected,
      },
      metrics: {
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg(),
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'critical',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Initialize cache
cacheService.initializeRedis();

// Start server
app.listen(PORT, async () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ Database: Supabase (${process.env.SUPABASE_URL})`);
  console.log(`✓ Health check available at http://localhost:${PORT}/health`);
});
