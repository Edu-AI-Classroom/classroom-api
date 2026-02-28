# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Configure Environment

Make sure your `.env` file exists and has the required variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/classroom_db?schema=public"
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### Step 4: Start Development Server

```bash
pnpm dev:api
```

### Step 5: Verify It's Working

Open your browser and visit:

- **API Health Check**: http://localhost:8080/api/health
- **Swagger Documentation**: http://localhost:8080/api/docs

---

## 📋 What You Have

✅ **NestJS** backend with Fastify  
✅ **Prisma** ORM configured for PostgreSQL  
✅ **Swagger** API documentation  
✅ **Health check** endpoint  
✅ **Global exception handling**  
✅ **Response transformation** interceptor  
✅ **Validation** pipes  
✅ **CORS** enabled  
✅ **Git hooks** for code quality  
✅ **E2E testing** setup

---

## 🎯 Next Steps

1. **Define your database schema** in `prisma/schema.prisma`
2. **Create your first module**:
   ```bash
   npx nx g @nx/nest:module modules/users
   npx nx g @nx/nest:controller modules/users
   npx nx g @nx/nest:service modules/users
   ```
3. **Add the module to `app.module.ts`**
4. **Start building your features!**

---

## 📖 Full Documentation

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed information about the project structure.

---

## 🆘 Troubleshooting

### Port Already in Use

Change `PORT` in `.env` file

### Database Connection Error

- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database exists

### Prisma Client Not Found

```bash
npx prisma generate
```

### Module Not Found Errors

```bash
pnpm install
```

---

Happy coding! 🎉
