import { hashPassword } from "../../src/lib/password.ts";
import { getPrisma } from "../../src/models/index.ts";

const prisma = getPrisma();

// User id of test user
export const mockUserId = "4b89cd52-19c4-4f60-8714-98775da43a5b";
export const mockPassword = "Password1!"
export const mockUserEmail = "testuser@example.com"

// User id of admin test user
export const mockAdminId = "2c3d83b8-9e29-45ed-90bd-6a29885e1383";

// Create or get test user from test db
export async function getOrCreateTestUser() {
  let user = await prisma.users.findUnique({ where: { id: mockUserId } });
  const hashedPassword = await hashPassword(mockPassword);

  if (!user) {
    user = await prisma.users.create({
      data: {
        id: mockUserId,
        email: mockUserEmail,
        username: "testxuser",
        password: hashedPassword,
      },
    });
  } else if (user.password !== hashedPassword) {
    // Reset the password to the expected test hash
    user = await prisma.users.update({
      where: { id: mockUserId },
      data: { password: hashedPassword },
    });
  }

  return user;
}


// Create or get admin test user from test db
export async function getOrCreateTestAdmin() {
  let user = await prisma.users.findUnique({ where: { id: mockAdminId } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        id: mockAdminId,
        email: "admin@example.com",
        username: "testadmin",
        password: await hashPassword(mockPassword),
        role: "admin"
      },
    });
  }
  return user;
}
