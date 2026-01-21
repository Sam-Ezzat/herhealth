import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import routes from '../src/routes';
import errorHandler from '../src/middleware/errorHandler';
import notFound from '../src/middleware/notFound';

const app = express();

// Security and CORS
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'https://herhealthfrontend.vercel.app',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'HerHealth OBGYN Clinic API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes - mounted at /api/v1
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export the Express app as a serverless function handler
export default app;
