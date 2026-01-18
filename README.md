# OBGYN Clinic Management System

A comprehensive web-based system for managing Obstetrics & Gynecology clinic operations, built with modern technologies.

## 🏗️ Project Structure

```
herhealth/
├── backend/          # Node.js + TypeScript + PostgreSQL API
├── frontend/         # React + TypeScript UI
├── OBGYN_ERD.md     # Database ERD documentation
└── OBGYN_DB_TABLES.md # Database schema
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **UI Components**: Custom components
- **Notifications**: React Toastify

## 📋 Features

The system is organized into 20 major feature modules:

1. **Authentication & Authorization** - User login, JWT tokens, role-based access
2. **Patient Management** - Complete patient records with color-coding
3. **Provider Management** - Doctor and staff management
4. **Appointment Scheduling** - Calendar-based appointment system
5. **Visit Management** - Clinical notes and visit records
6. **Pregnancy Management** - OB tracking and records
7. **Gynecology Records** - Exam findings and PAP results
8. **Laboratory Orders & Results** - Test ordering and results tracking
9. **Medical Imaging** - Imaging orders and reports
10. **Medication & Prescriptions** - Prescription management
11. **Inventory Management** - Medical supplies tracking
12. **Billing & Invoicing** - Financial management
13. **Consent Forms** - Digital consent management
14. **Reports & Analytics** - Clinical and business reports
15. **Search & Filter** - Global search functionality
16. **Audit Trail** - Activity logging
17. **Notifications** - In-app alerts and reminders
18. **Data Validation** - Comprehensive validation
19. **Error Handling** - Centralized error management
20. **Testing & Documentation** - Full test coverage

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=obgyn_clinic
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_secure_secret_key
   ```

5. Create database:
   ```bash
   psql -U postgres -c "CREATE DATABASE obgyn_clinic;"
   ```

6. Run migrations:
   ```bash
   psql -U postgres -d obgyn_clinic -f src/database/migrations/001_initial_schema.sql
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` if needed:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:3000`

## 📁 Project Architecture

### Backend Architecture

```
backend/src/
├── config/          # Configuration files (database, env)
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── models/          # Database models
├── routes/          # API route definitions
├── middleware/      # Express middleware
├── validators/      # Input validation schemas
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── database/        # Database migrations
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

### Frontend Architecture

```
frontend/src/
├── components/      # Reusable UI components
│   ├── common/     # Common components (Button, Input, etc.)
│   └── layout/     # Layout components (Header, Sidebar)
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API service layer
├── store/          # State management (Zustand)
├── types/          # TypeScript interfaces
├── utils/          # Utility functions
├── styles/         # Global styles
├── App.tsx         # Main app component
└── main.tsx        # Application entry point
```

## 🔐 Default Roles

The system includes 4 pre-configured roles:

- **Admin** - Full system access
- **Doctor** - Patient records, appointments, prescriptions
- **Nurse** - Patient records, appointments, visits
- **Receptionist** - Patient records, appointments

## 📊 Database Schema

See `OBGYN_ERD.md` for detailed Entity Relationship Diagram and table structures.

## 🧪 Development

### Backend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm test             # Run tests
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm test             # Run tests
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (RBAC)
- SQL injection protection via parameterized queries
- XSS protection with Helmet
- CORS configuration
- Input validation on all endpoints
- Secure HTTP headers

## 📝 API Documentation

API documentation will be available via Swagger/OpenAPI at:
`http://localhost:5000/api/docs` (to be implemented)

## 🤝 Contributing

1. Follow the existing code structure
2. Write clean, readable, maintainable code
3. Use TypeScript types for all variables
4. Add comments for complex logic
5. Follow ESLint and Prettier rules
6. Test before committing

## 📄 License

Private project - All rights reserved

## 👥 Team

Development team for HerHealth OBGYN Clinic System

---

**Status**: In Development  
**Last Updated**: December 2025
