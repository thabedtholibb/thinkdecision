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

const app = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));
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
