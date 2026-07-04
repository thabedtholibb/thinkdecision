require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const os = require('os');

const app = require('./src/app');
const cacheService = require('./src/services/cacheService');
const supabase = require('./src/config/supabase');

const PORT = process.env.PORT || 3000;
const startTime = Date.now();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
  credentials: true,
}));

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
