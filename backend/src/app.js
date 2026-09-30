const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const casesRoutes = require('./routes/cases');
const expertRoutes = require('./routes/experts');
const judgmentRoutes = require('./routes/judgments');
const resultsRoutes = require('./routes/results');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const auditLogsRoutes = require('./routes/auditLogs');

const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const sanitizationMiddleware = require('./middleware/sanitization');
const { publicLimiter, authenticatedLimiter } = require('./middleware/rateLimiter');

const app = express();
app.disable('x-powered-by');

// Zero-dependency hardening headers (no helmet dependency). A full
// Content-Security-Policy is intentionally NOT set here: the frontend still
// compiles via Babel standalone (unsafe-eval + inline scripts), so an
// enforcing CSP would break the app today. Precompile the frontend first,
// then add CSP (script-src 'self' + CDN allowlist, no unsafe-inline).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

// CORS configuration — single source of truth for the whole app (server.js
// used to register a second, stricter CORS middleware after all routes and
// the error handler, which never actually ran for API responses; that dead
// duplicate has been removed, so CORS_ORIGIN below is what's really enforced).
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(cors(corsOptions));
// Global abuse guards only in production — in development they just lock you
// out while testing (route-specific loginLimiter still applies everywhere).
if (process.env.NODE_ENV === 'production') {
  app.use(publicLimiter);
  app.use(authenticatedLimiter);
}
app.use(requestLogger);
// Improvement 18: Input Sanitization Middleware
app.use(sanitizationMiddleware);

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api/v1/openapi.json',
    urls: [
      { url: '/api/v1/openapi.json', name: 'v1' }
    ]
  }
}));

// OpenAPI spec endpoint
app.get('/api/v1/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes (login/register rate limiting is applied inside routes/auth.js)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/experts', expertRoutes);
app.use('/api/v1/judgments', judgmentRoutes);
app.use('/api/v1/results', resultsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
// Improvement 20: Audit Trail Querying
app.use('/api/v1/audit-logs', auditLogsRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
