import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const router = express.Router();

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KSP Crime Intelligence Platform — REST API',
      version: '2.0.0',
      description:
        'Official REST API documentation for the Karnataka State Police Crime Intelligence Platform. All endpoints require Bearer JWT authentication unless otherwise noted.',
      contact: {
        name: 'KSP IT Cell',
        email: 'it@ksp.gov.in',
      },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local Development Server' },
      { url: 'https://api.ksp-intel.gov.in', description: 'Production Server (Future)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Login, token management, and user sessions' },
      { name: 'FIR', description: 'First Information Report management, search, and export' },
      { name: 'Criminals', description: 'Criminal profiles, network analysis, and repeat offenders' },
      { name: 'Analytics', description: 'Dashboard statistics, crime hotspots, and geospatial data' },
      { name: 'AI', description: 'AI Investigation Copilot and LLM-powered reasoning' },
      { name: 'Workspace', description: 'Investigation canvas, pinned cases, and notes' },
      { name: 'Audit', description: 'System audit logs and compliance records' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at /api/docs
router.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `.swagger-ui .topbar { background-color: #1a237e; } .swagger-ui .topbar-wrapper img { content: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHk9IjE1IiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNSIgZm9udC13ZWlnaHQ9ImJvbGQiPktTUCBBUEk8L3RleHQ+PC9zdmc+"); }`,
    customSiteTitle: 'KSP Crime Intel API Docs',
  })
);

// Serve raw JSON spec at /api/docs.json
router.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;
