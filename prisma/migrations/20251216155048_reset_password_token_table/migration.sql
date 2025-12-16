/*
  Warnings:

  - You are about to drop the column `reset_password_expires_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `reset_password_token_hash` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "reset_password_expires_at",
DROP COLUMN "reset_password_token_hash";

-- CreateTable
CREATE TABLE "reset_password_tokens" (
    "id" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "reset_password_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reset_password_tokens" ADD CONSTRAINT "reset_password_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
