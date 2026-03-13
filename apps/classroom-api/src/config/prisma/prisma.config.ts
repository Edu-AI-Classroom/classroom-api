import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../../../../');

export default defineConfig({
  schema: path.join(workspaceRoot, 'prisma'),
  migrations: {
    path: path.join(workspaceRoot, 'prisma/migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
