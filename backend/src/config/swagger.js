const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Think Decision API',
      version: '1.0.0',
      description: 'Multi-Expert Decision Making System using AHP/ANP',
      contact: {
        name: 'Tech Team',
        email: 'tech@thinkdecision.com'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.thinkdecision.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token in header or httpOnly cookie'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'authToken',
          description: 'JWT token in httpOnly cookie'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['creator', 'expert'] },
            institution: { type: 'string' }
          }
        },
        Case: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            objective: { type: 'string' },
            method: { type: 'string', enum: ['AHP', 'ANP', 'Fuzzy AHP', 'Fuzzy ANP'] },
            status: { type: 'string', enum: ['draft', 'active', 'completed'] },
            deadline: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array' }
              }
            }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] }
    ]
  },
  apis: [
    './src/routes/auth.js',
    './src/routes/cases.js',
    './src/routes/users.js',
    './src/routes/experts.js',
    './src/routes/judgments.js',
    './src/routes/results.js',
    './src/routes/notifications.js',
    './src/routes/analytics.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
