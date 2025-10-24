import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });

// Re-export schema for convenience
export * from './schema';

// Export the schema object for migrations
export { schema };