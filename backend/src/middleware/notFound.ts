import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

export default notFound;
