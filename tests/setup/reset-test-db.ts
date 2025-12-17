import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../.env.test") });

console.log("Resetting test database...");

// Reset the test database
execSync(`npx prisma migrate reset --force`, {
	stdio: "inherit",
	env: {
		...process.env,
		DATABASE_URL: "postgres://test_user:test_password@localhost:5434/test_db",
	},
});

// Apply all migrations

execSync(`npx prisma migrate deploy`, {
	stdio: "inherit",
	env: {
		...process.env,
		DATABASE_URL: "postgres://test_user:test_password@localhost:5434/test_db",
	},
});

// Seed the database
execSync("node ./src/models/seeding.ts", {
	stdio: "inherit",
	env: { ...process.env, DATABASE_URL: "postgres://test_user:test_password@localhost:5434/test_db" },
});
