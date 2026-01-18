# Frontend README

## OBGYN Clinic - Frontend Application

Modern React-based user interface for the OBGYN Clinic Management System.

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
- **Notifications**: React Toastify
- **Icons**: React Icons
- **Styling**: CSS with CSS Variables

## Project Structure

```
src/
├── components/      # React components
│   ├── common/     # Reusable components (Button, Input, Modal)
│   └── layout/     # Layout components (Header, Sidebar, Footer)
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API services
│   └── api.ts     # Axios instance & interceptors
├── store/          # Zustand state stores
│   └── authStore.ts
├── types/          # TypeScript interfaces
│   ├── auth.ts
│   └── api.ts
├── utils/          # Utility functions
│   ├── dateUtils.ts
│   └── validators.ts
├── styles/         # Global styles
│   └── index.css
├── App.tsx         # Main app component
└── main.tsx        # Entry point
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=OBGYN Clinic
```

### 3. Start Development Server

```bash
npm run dev
```

Application runs on: `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Vitest

## Features Structure

### Authentication
- Login page with form validation
- Protected routes
- JWT token management
- Auto-logout on token expiration

### State Management (Zustand)
- Lightweight and performant
- No boilerplate
- DevTools support
- TypeScript-first

### API Integration
- Axios instance with interceptors
- Automatic token injection
- Error handling
- Request/response transformation

### Form Handling
- React Hook Form for performance
- Zod schema validation
- Error messages
- Form state management

## Styling Approach

### CSS Variables
Global design tokens in `src/styles/index.css`:
- Colors (primary, secondary, status colors)
- Spacing scale
- Typography
- Shadows
- Border radius
- Breakpoints

### Utility Classes
Common utility classes available:
- `.container` - Max-width container
- `.flex`, `.flex-col` - Flexbox layouts
- `.mt-*`, `.mb-*` - Margin utilities
- `.text-center`, `.text-right` - Text alignment

### Component Styling
- Module CSS or styled-components per component
- Consistent naming conventions
- Mobile-first responsive design

## Routing Structure

```
/                    # Home (Dashboard)
/login              # Login page
/patients           # Patient list
/patients/:id       # Patient detail
/patients/new       # New patient
/appointments       # Appointments calendar
/visits             # Visits list
/pregnancies        # Pregnancy tracking
/prescriptions      # Prescriptions
/lab-orders         # Lab orders
/imaging            # Imaging orders
/inventory          # Inventory management
/billing            # Billing & invoices
/reports            # Reports
/settings           # Settings
```

## Component Guidelines

### File Naming
- PascalCase for components: `PatientForm.tsx`
- camelCase for utilities: `dateUtils.ts`
- kebab-case for CSS: `patient-form.css`

### Component Structure
```tsx
import React from 'react';

interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // Component logic
  
  return (
    // JSX
  );
};

export default Component;
```

### Custom Hooks
```tsx
export const useCustomHook = () => {
  // Hook logic
  return { data, loading, error };
};
```

## API Service Usage

```tsx
import apiClient from '@/services/api';

// GET request
const data = await apiClient.get('/patients');

// POST request
const result = await apiClient.post('/patients', patientData);

// PUT request
const updated = await apiClient.put('/patients/123', patientData);

// DELETE request
await apiClient.delete('/patients/123');
```

## State Management Example

```tsx
import { useAuthStore } from '@/store/authStore';

const Component = () => {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  
  // Use state
};
```

## Form Validation Example

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = (data) => {
    // Handle submit
  };
};
```

## Date Utilities

```tsx
import { formatDate, formatDateTime, getAge } from '@/utils/dateUtils';

formatDate('2024-01-01'); // "Jan 1, 2024"
formatDateTime('2024-01-01T10:30:00'); // "Jan 1, 2024, 10:30 AM"
getAge('1990-01-01'); // 34
```

## Notifications

```tsx
import { toast } from 'react-toastify';

toast.success('Operation successful!');
toast.error('Something went wrong');
toast.info('Information message');
toast.warning('Warning message');
```

## TypeScript

### Strict Mode Enabled
- All variables must have types
- No implicit any
- Strict null checks

### Type Definitions
```tsx
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
}

type Status = 'active' | 'inactive' | 'pending';
```

## Performance Optimization

- Code splitting with lazy loading
- Memoization with React.memo
- useMemo and useCallback for expensive operations
- Virtual scrolling for large lists
- Image optimization
- Bundle size optimization

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast compliance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

1. Write TypeScript, not JavaScript
2. Use functional components with hooks
3. Keep components small and focused
4. Extract reusable logic into custom hooks
5. Use CSS variables for theming
6. Follow naming conventions
7. Add prop types/interfaces
8. Handle loading and error states
9. Test user interactions
10. Optimize for performance

## Build for Production

```bash
npm run build
```

Output in `dist/` directory.

Preview production build:
```bash
npm run preview
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | http://localhost:5000/api/v1 |
| VITE_APP_NAME | Application name | OBGYN Clinic |

## Troubleshooting

### Development Server Issues
- Clear node_modules and reinstall
- Check port 3000 availability
- Verify .env configuration

### Build Errors
- Run `npm run lint` to check errors
- Check TypeScript errors
- Verify all imports are correct

### API Connection Issues
- Verify backend is running
- Check CORS configuration
- Verify API base URL in .env
