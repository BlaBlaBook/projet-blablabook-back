import { execSync } from "node:child_process";

console.log("Resetting test database...");

// Reset the test database
execSync(`npx prisma migrate reset --force`, {
	stdio: "inherit",
	env: {
		...process.env,
		DATABASE_URL: process.env.DATABASE_URL,
	},
});

// Apply all migrations
execSync(`npx prisma migrate deploy`, {
	stdio: "inherit",
	env: {
		...process.env,
		DATABASE_URL: process.env.DATABASE_URL,
	},
});
