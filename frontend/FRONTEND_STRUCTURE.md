# Frontend Structure - Caja de Ahorro RDS

## Overview
The frontend has been reorganized from a monolithic App.js file into a modular structure for better maintainability and scalability.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.js       # Main layout wrapper with sidebar
│   ├── Login.js        # Login form component
│   └── Sidebar.js      # Navigation sidebar
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication context and provider
├── pages/              # Page components (routes)
│   ├── Dashboard.js    # Main dashboard with statistics
│   ├── Members.js      # Members management (Socios)
│   ├── Accounts.js     # Savings accounts management (Cuentas)
│   ├── Transactions.js # Transactions management
│   ├── MutualAid.js    # Mutual aid fund management
│   ├── Notifications.js # System notifications
│   ├── Security.js     # User and security management
│   └── Audit.js        # System audit logs
├── config/             # Configuration files
│   └── api.js          # API configuration and axios setup
├── hooks/              # Custom React hooks
│   └── use-toast.js    # Toast notification hook
├── components/ui/      # Shadcn UI components
└── App.js              # Main app component with routing
```

## Key Changes

### Before (App.js - 1700+ lines)
- Single monolithic file with all components
- Difficult to maintain and debug
- Poor separation of concerns
- Hard to navigate and find specific functionality

### After (Modular Structure)
- **Contexts**: Authentication logic separated into AuthContext
- **Components**: Reusable UI components (Layout, Sidebar, Login)
- **Pages**: Individual page components for each route
- **Config**: API configuration centralized
- **Clean routing**: Simplified App.js with clear route definitions

## Benefits

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused across the application
3. **Scalability**: Easy to add new pages and features
4. **Developer Experience**: Easier to find and modify specific functionality
5. **Code Organization**: Logical grouping of related functionality
6. **Testing**: Individual components can be tested in isolation

## Navigation Flow

```
App.js (Main Router)
├── /login → Login.js
└── Protected Routes (wrapped in Layout.js)
    ├── / → Dashboard.js
    ├── /members → Members.js
    ├── /accounts → Accounts.js
    ├── /transactions → Transactions.js
    ├── /mutual-aid → MutualAid.js
    ├── /notifications → Notifications.js
    ├── /security → Security.js
    └── /audit → Audit.js
```

## Authentication

- Managed through AuthContext.js
- JWT token stored in localStorage
- Protected routes require authentication
- Automatic redirection for unauthorized access

## API Integration

- Centralized in config/api.js
- Automatic token injection for authenticated requests
- Base URL configured from environment variables
- Consistent error handling across the application