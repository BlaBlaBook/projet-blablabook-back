const isDocker = process.env.NODE_ENV === "test";
process.env.DATABASE_URL = isDocker
  ? "postgres://test_user:test_password@test-db:5432/test_db"
  : "postgres://test_user:test_password@localhost:5434/test_db";


import { vi } from "vitest";

vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
