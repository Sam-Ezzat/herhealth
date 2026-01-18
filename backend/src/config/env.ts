import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: jwt.Secret;
    expiresIn: string | number;
    refreshSecret: jwt.Secret;
    refreshExpiresIn: string | number;
  };
  cors: {
    origin: string;
  };
  logLevel: string;
}

const config: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'obgyn_clinic',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
