import { defineConfig } from 'drizzle-kit';
import { loadDeploymentConfig } from './src/config/deployment-config.js';

// Same settings as the app: ENV (default dev) + real environment variables.
const settings = { ...loadDeploymentConfig(), ...process.env };

export default defineConfig({
  dialect: 'postgresql',
  // Each bounded context owns its tables next to its repository; the shared
  // kernel owns the trace events every context appends to.
  schema: [
    './src/contexts/*/infrastructure/persistence/*.schema.ts',
    './src/shared/infrastructure/persistence/*.schema.ts',
  ],
  out: './drizzle',
  dbCredentials: { url: settings.DATABASE_URL! },
  strict: true,
});
