import { getPrisma } from "../../src/models/index.ts";

const prisma = getPrisma();

// User id of test user
export const mockUserId = "4b89cd52-19c4-4f60-8714-98775da43a5b";

// Create or get test user from test db
export async function getOrCreateTestUser() {
  let user = await prisma.users.findUnique({ where: { id: mockUserId } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        id: mockUserId,
        email: "testuser@example.com",
        username: "testxuser",
        password: "password",
      },
    });
  }
  return user;
}
