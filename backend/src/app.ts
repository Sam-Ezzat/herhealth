import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import config from './config/env';
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';
import routes from './routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'HerHealth OBGYN Clinic API is running',
    timestamp: new Date().toISOString(),
  });
});

// Favicon handler to avoid 404 noise
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// API routes
app.use(config.apiPrefix, routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
