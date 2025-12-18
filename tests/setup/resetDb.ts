import type { PrismaClient } from "../../generated/prisma/client.ts";

export async function resetDb(prisma: PrismaClient) {
	await prisma.$executeRawUnsafe(`
	TRUNCATE TABLE
    comments,
    user_book_records,
    book_author,
    book_genre,
    books,
    authors,
    genres,
    users,
    refresh_tokens
  RESTART IDENTITY CASCADE;
	`);
}
