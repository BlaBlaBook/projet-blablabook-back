/*
  Warnings:

  - You are about to drop the column `rating` on the `comments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "comments" DROP COLUMN "rating";

-- AlterTable
ALTER TABLE "user_book_records" ADD COLUMN     "rating" INTEGER;
