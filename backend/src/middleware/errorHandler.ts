import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import config from '../config/env';

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const apiError = error as ApiError;
  const { statusCode, message } = apiError;

  const response = {
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: apiError.stack }),
  };

  logger.error(message, {
    statusCode,
    url: req.url,
    method: req.method,
    stack: apiError.stack,
  });

  res.status(statusCode).json(response);
};

export default errorHandler;
