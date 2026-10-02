import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  // Each bounded context owns its tables next to its repository; the shared
  // kernel owns the trace events every context appends to.
  schema: [
    './src/contexts/*/infrastructure/persistence/*.schema.ts',
    './src/shared/infrastructure/persistence/*.schema.ts',
  ],
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
});
