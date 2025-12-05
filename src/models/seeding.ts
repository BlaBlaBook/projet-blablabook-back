import { hash } from "argon2";
import { prisma } from "./index.ts";

async function main() {
  const adminPassword = await hash("admin123");
  const userPassword = await hash("user123");

  const admin = await prisma.users.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
  });

  const user = await prisma.users.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      username: "user",
      password: userPassword,
      role: "user",
    },
  });

  const booksData = [
    {
      title: "Le Cercle",
      summary: "1999. Beth, Brunson, Spence, Freddy et Ramin...",
      year: 2023,
      isbn: "2408043964",
      authors: ["Abdi Nazemian", "Georges Content"],
      pages: 359,
      imageUrl: "http://books.google.com/books/content?id=bhG4EAAAQBAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
      genres: ["Juvenile Fiction"],
    },
    {
      title: "Moby-Dick",
      summary: "« Moby-Dick » est un roman d'aventure emblématique...",
      year: 2025,
      isbn: "2810629870",
      authors: ["Herman Melville"],
      pages: 832,
      imageUrl: "http://books.google.com/books/content?id=8s9dEQAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Le Seigneur des Anneaux T1 La fraternité de l'anneau",
      summary: "Dans un paisible village du Comté, le jeune Frodo...",
      year: 2022,
      isbn: "2267051893",
      authors: ["J.R.R. Tolkien"],
      pages: 731,
      imageUrl: "http://books.google.com/books/content?id=WmOFEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Harry Potter à L'école des Sorciers",
      summary: "Le jour de ses onze ans, Harry Potter...",
      year: 2015,
      isbn: "1781101035",
      authors: ["J.K. Rowling"],
      pages: 362,
      imageUrl: "http://books.google.com/books/content?id=nvijsUyJYR4C&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Juvenile Fiction"],
    },
    {
      title: "Crime et Châtiment",
      summary: "Seul l'être capable d'indépendance spirituelle...",
      year: 2020,
      isbn: "2322224081",
      authors: ["Fiodor Dostoïevski"],
      pages: 294,
      imageUrl: "http://books.google.com/books/content?id=CELnDwAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Les Misérables - Tome 1",
      summary: "« La vie, le malheur, l’isolement, l’abandon...",
      year: 2025,
      isbn: "9782253000000",
      authors: ["Victor Hugo"],
      pages: 1038,
      imageUrl: "http://books.google.com/books/content?id=I1CFEQAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Hunger Games - tome 1",
      summary: "Le best-seller mondial en version numérique...",
      year: 2011,
      isbn: "2266223674",
      authors: ["Suzanne Collins"],
      pages: 240,
      imageUrl: "http://books.google.com/books/content?id=lEnrxE2FUFAC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Young Adult Fiction"],
    },
    {
      title: "Twilight - Tome 1 : Fascination",
      summary: "Isabella Swan, 17 ans, déménage à Forks...",
      year: 2005,
      isbn: "2012019706",
      authors: ["Stephenie Meyer"],
      pages: 373,
      imageUrl: "http://books.google.com/books/content?id=zZcCDBFPh94C&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Juvenile Fiction"],
    },
    {
      title: "La vie est facile, ne t'inquiète pas",
      summary: "La suite de l'album Les gens heureux lisent...",
      year: 2023,
      isbn: "2749952247",
      authors: ["Agnès Martin-Lugand", "Véronique Grisseaux"],
      pages: 146,
      imageUrl: "http://books.google.com/books/content?id=q7XYEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Comics & Graphic Novels"],
    },
    {
      title: "Gone, Baby, Gone",
      summary: "“Powerful and raw, harrowing, and unsentimental...”",
      year: 2009,
      isbn: "0061802735",
      authors: ["Dennis Lehane"],
      pages: 560,
      imageUrl: "http://books.google.com/books/content?id=a0He4Alb3ZIC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Shutter Island",
      summary: "The basis for the blockbuster motion picture...",
      year: 2010,
      isbn: "0748124802",
      authors: ["Dennis Lehane"],
      pages: 269,
      imageUrl: "http://books.google.com/books/content?id=VIPkHaY_FhUC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Dune",
      summary: "En 2020, Dune reste le roman de science-fiction...",
      year: 2020,
      isbn: "2100819232",
      authors: ["Nicolas Allard"],
      pages: 182,
      imageUrl: "http://books.google.com/books/content?id=3SEAEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Photography"],
    },
    {
      title: "Le meilleur des mondes et Retour au meilleur des mondes",
      summary: "Le chef d'œuvre d'Aldous Huxley...",
      year: 2015,
      isbn: "2259243517",
      authors: ["Aldous Huxley"],
      pages: 310,
      imageUrl: "http://books.google.com/books/content?id=eQzXCQAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
    {
      title: "Ready player one - Tome 1",
      summary: "LE LIVRE QUI A INSPIRE LE DERNIER FILM DE STEVEN SPIELBERG...",
      year: 2018,
      isbn: "2749935881",
      authors: ["Ernest Cline"],
      pages: 447,
      imageUrl: "http://books.google.com/books/content?id=iN1MDwAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Literary Collections"],
    },
    {
      title: "1984",
      summary: "Winston Smith, obscur tâcheron au ministère de la Vérité...",
      year: 2021,
      isbn: "2035971217",
      authors: ["George Orwell"],
      pages: 256,
      imageUrl: "http://books.google.com/books/content?id=BFZlEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
      genres: ["Fiction"],
    },
  ];

  for (const b of booksData) {
    const book = await prisma.books.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        summary: b.summary,
        year: b.year,
        isbn: b.isbn,
        pages: b.pages,
        language: "fr",
        image_url: b.imageUrl,
      },
    });

    // auteurs
    for (const name of b.authors) {
      const [first_name, ...rest] = name.split(" ");
      const last_name = rest.join(" ");
      await prisma.book_author.create({
        data: {
          book: { connect: { id: book.id } },
          author: {
            connectOrCreate: {
              where: { id: crypto.randomUUID() }, // temporaire
              create: { first_name, last_name },
            },
          },
        },
      });
    }

    // genres
    for (const category of b.genres) {
      await prisma.book_genre.create({
        data: {
          book: { connect: { id: book.id } },
          genre: {
            connectOrCreate: {
              where: { id: crypto.randomUUID() }, // temporaire
              create: { category },
            },
          },
        },
      });
    }

    // assigner certains livres à l'utilisateur (par exemple tous)
    await prisma.user_book_records.create({
      data: {
        book: { connect: { id: book.id } },
        user: { connect: { id: user.id } },
        reading_status: "à_lire"
      },
    });
  }

  console.log("✅ Seed complet exécuté correctement");
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
