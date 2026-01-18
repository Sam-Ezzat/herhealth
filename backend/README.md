# Backend README

## OBGYN Clinic - Backend API

RESTful API server for the OBGYN Clinic Management System.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Password**: bcrypt
- **Logging**: Morgan + Custom logger

## Project Structure

```
src/
├── config/          # App configuration
│   ├── database.ts # Database connection
│   └── env.ts      # Environment variables
├── controllers/     # Route controllers (business logic)
├── services/        # Service layer (data access)
├── models/          # Database models/queries
├── routes/          # API routes
├── middleware/      # Express middleware
│   ├── auth.ts     # Authentication middleware
│   ├── errorHandler.ts
│   └── notFound.ts
├── validators/      # Request validation schemas
├── utils/           # Utility functions
│   ├── ApiError.ts
│   ├── ApiResponse.ts
│   └── logger.ts
├── types/           # TypeScript types
├── database/        # Database migrations
├── app.ts           # Express app
└── server.ts        # Server entry point
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=obgyn_clinic
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

Create database:
```bash
psql -U postgres -c "CREATE DATABASE obgyn_clinic;"
```

Run migrations:
```bash
psql -U postgres -d obgyn_clinic -f src/database/migrations/001_initial_schema.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on: `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## API Endpoints

### Health Check
```
GET /health
```

### Authentication (to be implemented)
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

### Patients (to be implemented)
```
GET    /api/v1/patients
GET    /api/v1/patients/:id
POST   /api/v1/patients
PUT    /api/v1/patients/:id
DELETE /api/v1/patients/:id
```

## Error Handling

All errors are handled centrally via `errorHandler` middleware.

Error response format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Success Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

## Authentication

Protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Database Schema

See `src/database/migrations/001_initial_schema.sql` for complete schema.

## Clean Architecture

The backend follows clean architecture principles:

1. **Controllers** - Handle HTTP requests/responses
2. **Services** - Business logic layer
3. **Models** - Database operations
4. **Validators** - Input validation
5. **Middleware** - Cross-cutting concerns

## Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Explicit return types on functions
- Async/await for asynchronous operations

## Security

- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Helmet for security headers
- CORS configuration
- SQL injection prevention (parameterized queries)
- Input validation on all endpoints
- Environment variable protection

## Development Guidelines

1. Use TypeScript types for all variables
2. Follow existing naming conventions
3. Add JSDoc comments for complex functions
4. Write unit tests for services
5. Validate all user inputs
6. Handle errors properly
7. Use async/await instead of callbacks
8. Keep functions small and focused

## Deployment

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Environment Variables

Required environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | obgyn_clinic |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | Token expiration | 24h |
| CORS_ORIGIN | Frontend URL | http://localhost:3000 |

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env`
- Kill process using port 5000

### TypeScript Errors
- Run `npm install`
- Check tsconfig.json
- Verify all type definitions installed
