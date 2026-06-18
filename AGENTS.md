# Backend Agent Notes

## Project Overview

This is the Teachify classroom API, a NestJS/Nx backend using Prisma 7 with PostgreSQL/NeonDB. The app is mounted under the global `/api` prefix and exposes Swagger at `/api/docs`.

Core areas:

- `apps/classroom-api/src/app/app.module.ts`: root module registration.
- `apps/classroom-api/src/main.ts`: global prefix, CORS, validation pipe, response interceptor, Swagger.
- `apps/classroom-api/src/modules/*`: feature modules such as auth, classroom, quizzes, parent, chat, notification, admin dashboard.
- `apps/classroom-api/src/infrastructure/prisma`: Prisma service and database access.
- `prisma/models/*.prisma`: schema split by model.
- `prisma/migrations/*`: database migrations.
- `docs/*.sql`: local/demo seed scripts.

## Commands

Run from `classroom-api`.

```powershell
pnpm dev:api
pnpm build:api
npx tsc -p apps\classroom-api\tsconfig.app.json --noEmit
npx prisma validate --config=./apps/classroom-api/src/config/prisma/prisma.config.ts
npx prisma generate --config=./apps/classroom-api/src/config/prisma/prisma.config.ts
npx prisma migrate deploy --config=./apps/classroom-api/src/config/prisma/prisma.config.ts
```

If pnpm blocks dependency build scripts, run:

```powershell
pnpm approve-builds
pnpm install
```

## Local Env

Backend `.env` should include:

```env
PORT=8080
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://..."
```

NeonDB connection strings must include `sslmode=require`.

## API Conventions

- All routes live under `/api`.
- Controllers should return raw data unless they need a custom envelope. `TransformResponseInterceptor` wraps responses as `{ success, statusCode, data, ... }`.
- Global `ValidationPipe` uses `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
- DTO fields that are accepted in request bodies must have class-validator decorators. `@ApiProperty` alone is not enough.
- Protected endpoints rely on `JwtAuthGuard` globally and `RolesGuard`/`@Roles()` where role access is required.

## Prisma / Database Rules

- Keep schema changes in `prisma/models/*.prisma` and create a migration under `prisma/migrations`.
- Use the configured Prisma command with `--config=./apps/classroom-api/src/config/prisma/prisma.config.ts`.
- Prefer structured Prisma queries over raw SQL in application code.
- Demo seed SQL should be idempotent and safe to run more than once.
- When adding seed rows to tables with serial IDs, consider syncing sequences if the database may have manual inserts.

## Feature Patterns

- Feature modules usually contain `*.module.ts`, `*.controller.ts`, `*.service.ts`, and `dtos.ts`.
- Register new modules in `AppModule`; missing module imports are a common cause of `404 Not Found`.
- File uploads use the existing Cloudflare R2 service.
- Chat currently uses REST + polling, not WebSocket.
- Notifications are persisted in `notification` and frontend polling reads them.

## Verification Expectations

For backend changes, run at least:

```powershell
npx tsc -p apps\classroom-api\tsconfig.app.json --noEmit
npx prisma validate --config=./apps/classroom-api/src/config/prisma/prisma.config.ts
```

Run `npx prisma generate ...` after schema changes.

## Do Not Commit

Avoid committing local/tooling noise unless intentionally requested:

- `package-lock.json` generated in this pnpm repo
- accidental pnpm workspace changes from `approve-builds`
- local logs
- `.env`
