-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "reading_status" AS ENUM ('à lire', 'en cours', 'lu');

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "isbn" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "language" VARCHAR(5) NOT NULL,
    "pages" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL,
    "last_name" VARCHAR(60) NOT NULL,
    "first_name" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_author" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" UUID NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_genre" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(60),
    "first_name" VARCHAR(60),
    "username" VARCHAR(60) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_book_records" (
    "id" UUID NOT NULL,
    "reading_status" "reading_status" NOT NULL DEFAULT 'à lire',
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_book_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "book_author_book_id_author_id_key" ON "book_author"("book_id", "author_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_genre_book_id_genre_id_key" ON "book_genre"("book_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_book_records_user_id_book_id_key" ON "user_book_records"("user_id", "book_id");

-- AddForeignKey
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_author" ADD CONSTRAINT "book_author_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_genre" ADD CONSTRAINT "book_genre_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_genre" ADD CONSTRAINT "book_genre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_book_records" ADD CONSTRAINT "user_book_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_book_records" ADD CONSTRAINT "user_book_records_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
