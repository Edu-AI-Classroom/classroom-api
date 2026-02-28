# Project Structure Guide

## Overview

This is a **NestJS backend API** built using:

- **Nx Monorepo** - For managing multiple applications and libraries
- **Fastify** - High-performance HTTP server (instead of Express)
- **Prisma** - Modern ORM for PostgreSQL database
- **TypeScript** - Type-safe JavaScript
- **Swagger** - API documentation
- **Jest** - Testing framework

---

## 📁 Folder Structure

### Root Level Files

```
classroom-api/
├── package.json          # Project dependencies and scripts
├── pnpm-lock.yaml        # Lock file for pnpm package manager
├── pnpm-workspace.yaml   # Pnpm workspace configuration
├── nx.json               # Nx monorepo configuration
├── tsconfig.base.json    # Base TypeScript configuration
├── jest.config.ts        # Jest testing configuration
├── jest.preset.js        # Jest preset for Nx
├── eslint.config.mjs     # ESLint configuration
├── .prettierrc           # Prettier code formatting rules
├── commitlint.config.cjs # Commit message linting rules
├── prisma.config.ts      # Prisma configuration
└── README.md             # Project documentation
```

### Configuration Files

- **`.editorconfig`** - Editor configuration for consistent coding styles
- **`.prettierignore`** - Files to ignore for Prettier formatting
- **`.gitignore`** - Files to exclude from git
- **`.husky/`** - Git hooks (pre-commit, commit-msg) for code quality
- **`.github/workflows/`** - CI/CD pipeline configuration
- **`.vscode/`** - VS Code settings and launch configurations

---

## 📂 `apps/` Directory

Contains all applications in the monorepo.

### `apps/classroom-api/` - Main API Application

This is your **main NestJS application**.

```
apps/classroom-api/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app/
│   │   └── app.module.ts          # Root module (imports all modules)
│   │
│   ├── modules/                   # Feature modules (business logic)
│   │   └── health/                # Health check module (example)
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       ├── health.module.ts
│   │       ├── dtos/              # Data Transfer Objects
│   │       └── types/              # TypeScript types
│   │
│   ├── common/                    # Shared/common code
│   │   ├── constants/             # Application constants
│   │   ├── dto/                   # Shared DTOs (pagination, API response)
│   │   ├── filters/               # Exception filters
│   │   └── interceptors/          # Response interceptors
│   │
│   ├── config/                    # Configuration modules
│   │   ├── health/                # Health check configuration
│   │   └── swagger/               # Swagger/OpenAPI configuration
│   │
│   ├── infrastructure/            # Infrastructure layer (database, external services)
│   │   └── prisma/
│   │       ├── prisma.module.ts   # Prisma module
│   │       └── prisma.service.ts  # Prisma service (database client)
│   │
│   └── assets/                    # Static assets
│
├── project.json                   # Nx project configuration
├── tsconfig.json                  # TypeScript config for this app
├── tsconfig.app.json              # App-specific TS config
├── tsconfig.spec.json             # Test-specific TS config
├── jest.config.cts                # Jest config for this app
├── eslint.config.mjs              # ESLint config for this app
└── webpack.config.js              # Webpack bundler config
```

**Key Files Explained:**

1. **`main.ts`** - Bootstrap file that:
   - Creates the NestJS application
   - Sets up global prefix (`/api`)
   - Configures global filters, interceptors, validation pipes
   - Enables CORS
   - Sets up Swagger documentation
   - Starts the server

2. **`app.module.ts`** - Root module that imports:
   - `ConfigModule` - Environment variables
   - `HealthModule` - Health check endpoints
   - `PrismaModule` - Database access

3. **`modules/`** - Feature modules (where you'll add your business logic)
   - Each module typically has: controller, service, module, DTOs, types
   - Example: `health` module for `/api/health` endpoint

4. **`common/`** - Shared utilities:
   - **`filters/`** - `GlobalExceptionFilter` catches all errors
   - **`interceptors/`** - `TransformResponseInterceptor` formats API responses
   - **`dto/`** - Shared DTOs like `ApiResponseDto`, `PaginationDto`

5. **`infrastructure/`** - External services integration:
   - **`prisma/`** - Database connection and Prisma client

### `apps/classroom-api-e2e/` - End-to-End Tests

```
apps/classroom-api-e2e/
├── src/
│   ├── classroom-api/
│   │   └── classroom-api.spec.ts  # E2E test file
│   └── support/
│       ├── global-setup.ts         # Test setup
│       ├── global-teardown.ts      # Test cleanup
│       └── test-setup.ts           # Test configuration
└── project.json                    # Nx project config for E2E tests
```

---

## 📂 `prisma/` Directory

```
prisma/
└── schema.prisma                   # Database schema definition
```

**`schema.prisma`** - Defines your database schema:

- Database provider (PostgreSQL)
- Models (tables)
- Relationships
- Run `npx prisma generate` to generate Prisma Client
- Run `npx prisma migrate dev` to create migrations

---

## 📂 `docs/` Directory

```
docs/
├── commit-rule.md                  # Commit message conventions
└── PROJECT_STRUCTURE.md            # This file
```

---

## 🚀 How to Start

### Prerequisites

1. **Node.js** (v18+ recommended)
2. **pnpm** package manager (`npm install -g pnpm`)
3. **PostgreSQL** database running

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/classroom_db?schema=public"

# Server
PORT=8080
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Add other environment variables as needed
```

### Step 3: Set Up Database

1. **Create your database** in PostgreSQL
2. **Define your schema** in `prisma/schema.prisma`
3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```
4. **Run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

### Step 4: Start Development Server

```bash
# Using pnpm script
pnpm dev:api

# Or using Nx directly
npx nx serve classroom-api
```

The API will be available at:

- **API**: `http://localhost:8080/api`
- **Swagger Docs**: `http://localhost:8080/api/docs`
- **Health Check**: `http://localhost:8080/api/health`

---

## 🏗️ Architecture Patterns

### Module Structure

Each feature module should follow this structure:

```
modules/your-feature/
├── your-feature.controller.ts    # HTTP endpoints
├── your-feature.service.ts        # Business logic
├── your-feature.module.ts         # Module definition
├── dtos/                          # Request/Response DTOs
│   ├── create-your-feature.dto.ts
│   └── update-your-feature.dto.ts
├── types/                         # TypeScript types
└── entities/                      # Database entities (if needed)
```

### Example: Creating a New Module

1. **Generate module**:

   ```bash
   npx nx g @nx/nest:module modules/users
   npx nx g @nx/nest:controller modules/users
   npx nx g @nx/nest:service modules/users
   ```

2. **Add to `app.module.ts`**:
   ```typescript
   imports: [
     // ... existing imports
     UsersModule,
   ];
   ```

---

## 🛠️ Available Scripts

```bash
# Development
pnpm dev:api              # Start dev server with hot reload

# Build
pnpm build:api            # Build for production

# Production
pnpm start                # Start production server

# Database
npx prisma generate       # Generate Prisma Client
npx prisma migrate dev    # Create and apply migration
npx prisma studio         # Open Prisma Studio (DB GUI)

# Testing
npx nx test classroom-api           # Run unit tests
npx nx test classroom-api-e2e      # Run E2E tests

# Linting
npx nx lint classroom-api           # Run ESLint

# Code Formatting
npx prettier --write .              # Format all files
```

---

## 📝 Code Quality Tools

### Git Hooks (Husky)

- **pre-commit**: Runs ESLint and Prettier on staged files
- **commit-msg**: Validates commit messages against conventional commits

### Linting & Formatting

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Commitlint**: Commit message validation

---

## 🔑 Key Technologies

| Technology            | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| **NestJS**            | Node.js framework with decorators, dependency injection |
| **Fastify**           | Fast HTTP server (alternative to Express)               |
| **Prisma**            | Type-safe database ORM                                  |
| **PostgreSQL**        | Relational database                                     |
| **Swagger**           | API documentation                                       |
| **Nx**                | Monorepo tooling and build system                       |
| **TypeScript**        | Type-safe JavaScript                                    |
| **Jest**              | Testing framework                                       |
| **class-validator**   | DTO validation                                          |
| **class-transformer** | Object transformation                                   |

---

## 📚 Next Steps

1. **Define your database schema** in `prisma/schema.prisma`
2. **Create your first module** (e.g., `users`, `courses`, `assignments`)
3. **Set up authentication** (JWT, Passport)
4. **Add more modules** following the established patterns
5. **Write tests** for your modules
6. **Configure CI/CD** in `.github/workflows/`

---

## 🆘 Common Commands

```bash
# View project graph
npx nx graph

# Run specific target
npx nx run classroom-api:build

# Generate code
npx nx g @nx/nest:module modules/feature-name

# Check what's affected
npx nx affected:test

# Reset database (careful!)
npx prisma migrate reset
```

---

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Nx Documentation](https://nx.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Fastify Documentation](https://www.fastify.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

Happy coding! 🚀
