-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_password_expires_at" TIMESTAMPTZ,
ADD COLUMN     "reset_password_token_hash" VARCHAR(255);
