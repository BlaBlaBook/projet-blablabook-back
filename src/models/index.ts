import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from '@prisma/adapter-pg';

// Create the PostgreSQL adapter
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
});

// Instantiate Prisma Client with the adapter
export const prisma = new PrismaClient({ adapter });

export * from "../../generated/prisma/client.ts";