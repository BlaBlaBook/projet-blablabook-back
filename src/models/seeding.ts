import { hash } from "argon2";
import { prisma } from "./index.ts";

async function main() {
	const adminPassword = await hash("Admin123!");
	const userPassword = await hash("User123!");

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
			summary:
				"1999. Beth, Brunson, Spence, Freddy et Ramin sont tous élèves de la prestigieuse Chandler Academy. Ils ont entre 15 et 17 ans, et, cette année, ils sont les cinq privilégiés à avoir été acceptés dans Le Cercle, le club le plus sélect du campus, dédié à l'écriture. Malgré leurs différences, ils forment rapidement une vraie famille et se confient les uns aux autres... notamment sur la Chandler Academy qui n'est pas l'endroit idyllique qu'ils croyaient. Découvrez la Chandler Academy, où règnent le luxe et la loi du silence... Malgré sa réputation prestigieuse, la Chandler Academy cache bien des scandales : avec beaucoup de justesse, Abdi Nazeimian livre ici un texte militant, invitant les victimes d'abus à s'exprimer par tous les moyens possibles, dont l'écriture. \"L'univers de Nazemian est inclusif mais non dénué de brutalité. Il célèbre la différence mais ne cesse de l'interroger. \"Le cercle\" est un roman dont les lecteurs n'ont pas fini de débattre.\" (E. Lockhart, \"Nous, les menteurs\".) « Un roman choral qui interroge sur la possibilité de changer un système toxique. Il est question d'homosexualité interdite en Iran et stigmatisée sur le campus, d'origines sociales ou géographiques, culturelles et du pouvoir de l'écriture. Un récit foisonnant qui sonne juste. » La revue des livres pour enfants",
			year: 2023,
			isbn: "2408043964",
			authors: ["Abdi Nazemian", "Georges Content"],
			pages: 359,
			imageUrl:
				"http://books.google.com/books/content?id=bhG4EAAAQBAJ&printsec=frontcover&img=1&zoom=2&source=gbs_api",
			genres: ["Juvenile Fiction"],
		},
		{
			title: "Moby-Dick",
			summary:
				"« Moby-Dick » est un roman d'aventure emblématique de la littérature américaine, relatant la narration à la première personne d'Ismaël, un marin en quête de sens. Il embarque à bord du baleinier Pequod, dirigé par le capitaine Achab, un homme consumé par une quête obsessionnelle : traquer et vaincre Moby Dick, un cachalot blanc gigantesque qui lui a coûté une jambe lors d'une précédente expédition. Au fil de cette aventure maritime, le lecteur est immergé dans une exploration profonde de la condition humaine, du destin et de la lutte entre l'homme et la nature. Le roman se distingue par son symbolisme riche et ses allégories, abordant des thèmes philosophiques et existentialistes. Le voyage du Pequod devient une métaphore de la quête de sens, où chaque membre de l'équipage représente une facette de l'humanité. Le capitaine Achab incarne l'obsession dévorante, tandis que Moby Dick symbolise l'inconnu, le mystère insondable de l'existence. À travers des descriptions détaillées de la vie en mer et des réflexions métaphysiques, Herman Melville offre une oeuvre monumentale qui transcende le simple récit d'aventure. « Moby-Dick » est une méditation sur la nature humaine, la folie, et la quête de vérité, consolidant sa place parmi les classiques de la littérature américaine.",
			year: 2025,
			isbn: "2810629870",
			authors: ["Herman Melville"],
			pages: 832,
			imageUrl:
				"http://books.google.com/books/content?id=8s9dEQAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Le Seigneur des Anneaux T1 La fraternité de l'anneau",
			summary: "Dans un paisible village du Comté, le jeune Frodo...",
			year: 2022,
			isbn: "2267051893",
			authors: ["J.R.R. Tolkien"],
			pages: 731,
			imageUrl:
				"http://books.google.com/books/content?id=WmOFEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Harry Potter à L'école des Sorciers",
			summary:
				"Le jour de ses onze ans, Harry Potter, un orphelin élevé par un oncle et une tante qui le détestent, voit son existence bouleversée. Un géant vient le chercher pour l’emmener à Poudlard, une école de sorcellerie! Voler en balai, jeter des sorts, combattre les trolls : Harry Potter se révèle un sorcier doué. Mais un mystère entoure sa naissance et l’effroyable V..., le mage dont personne n’ose prononcer le nom. Amitié, surprises, dangers, scènes comiques, Harry découvre ses pouvoirs et la vie à Poudlard. Le premier tome des aventures du jeune héros vous ensorcelle aussitôt!",
			year: 2015,
			isbn: "1781101035",
			authors: ["J.K. Rowling"],
			pages: 362,
			imageUrl:
				"http://books.google.com/books/content?id=nvijsUyJYR4C&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Juvenile Fiction"],
		},
		{
			title: "Crime et Châtiment",
			summary:
				"Seul l'être capable d'indépendance spirituelle est digne des grandes entreprises. Tel Napoléon qui n'hésita pas à ouvrir le feu sur une foule désarmée, Raskolnikov, qui admire le grand homme, se place au-dessus du commun des mortels. Les considérations théoriques qui le poussent à tuer une vieille usurière cohabitent en s'opposant dans l'esprit du héros et constituent l'essence même du roman. Pour Raskolnikov, le crime qu'il va commettre n'est que justice envers les hommes en général et les pauvres qui se sont fait abusés en particulier. \"Nous acceptons d'être criminels pour que la terre se couvre enfin d'innocents\", écrira Albert Camus. Mais cet idéal d'humanité s'accorde mal avec la conscience de supériorité qui anime le héros, en qualité de \"surhomme\", il se situe au-delà du bien et du mal. Fomenté avec un sang-froid mêlé de mysticisme, le meurtre tourne pourtant à l'échec. Le maigre butin ne peut satisfaire son idéal de justice, tandis que le crime loin de l'élever de la masse, l'abaisse parmi les hommes. Raskolnikov finira par se rendre et accepter la condamnation, par-là même, il accédera à la purification. Crime et Châtiment est le roman de la déchéance humaine, l'oeuvre essentielle du maître de la littérature russe.",
			year: 2020,
			isbn: "2322224081",
			authors: ["Fiodor Dostoïevski"],
			pages: 294,
			imageUrl:
				"http://books.google.com/books/content?id=CELnDwAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Les Misérables - Tome 1",
			summary:
				"« La vie, le malheur, l’isolement, l’abandon, la pauvreté, sont des champs de bataille qui ont leurs héros ; héros obscurs plus grands parfois que les héros illustres. » Après dix-neuf ans de bagne, le forçat Jean Valjean retrouve la liberté. En quête de rédemption, il croisera le chemin de Fantine, Cosette, Marius, l’inspecteur Javert, et bien d’autres personnages entrés dans le Panthéon de la littérature. Fresque historique et sociale d’une ampleur inégalée, Les Misérables peint une œuvre « ayant la fraternité pour base et le progrès pour cime ». Victor Hugo (1802-1885) occupe une place exceptionnelle dans la littérature française. Dramaturge, poète et romancier, il nous a légué Cosette, Jean Valjean et Ruy Blas. Ses combats pour l’abolition de la peine de mort et pour les droits de l’homme influencent encore notre époque.",
			year: 2025,
			isbn: "9782253000000",
			authors: ["Victor Hugo"],
			pages: 1038,
			imageUrl:
				"http://books.google.com/books/content?id=I1CFEQAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Hunger Games - tome 1",
			summary:
				"Le best-seller mondial en version numérique ! Peeta et Katniss sont tirés au sort pour participer aux Hunger Games. La règle est simple : 24 candidats pour un seul survivant, le tout sous le feu des caméras... Dans un futur sombre, sur les ruines des États-Unis, un jeu télévisé est créé pour contrôler le peuple par la terreur. Douze garçons et douze filles tirés au sort participent à cette sinistre téléréalité, que tout le monde est forcé de regarder en direct. Une seule règle dans l'arène : survivre, à tout prix. Quand sa petite sœur est appelée pour participer aux Hunger Games, Katniss n'hésite pas une seconde. Elle prend sa place, consciente du danger. À seize ans, Katniss a déjà été confrontée plusieurs fois à la mort. Chez elle, survivre est comme une seconde nature...",
			year: 2011,
			isbn: "2266223674",
			authors: ["Suzanne Collins"],
			pages: 240,
			imageUrl:
				"http://books.google.com/books/content?id=lEnrxE2FUFAC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Young Adult Fiction"],
		},
		{
			title: "Twilight - Tome 1 : Fascination",
			summary:
				"Isabella Swan, 17 ans, déménage à Forks, petite ville pluvieuse dans l'état de Washington, pour vivre avec son père. Elle s'attend à ce que sa nouvelle vie soit aussi ennuyeuse que la ville elle-même. Or, au lycée, elle est terriblement intriguée par le comportement d'une étrange fratrie, deux filles et trois garçons. Bella tombe follement amoureuse de l'un d'eux, Edward Cullen. Ce garçon beau comme un dieu et qui lui sauve la vie plusieurs fois a selon les Indiens le sang froid... Une relation sensuelle et dangereuse commence alors entre les deux jeunes gens : quand Isabella admet que Edward est un vampire, il est déjà trop tard.",
			year: 2005,
			isbn: "2012019706",
			authors: ["Stephenie Meyer"],
			pages: 373,
			imageUrl:
				"http://books.google.com/books/content?id=zZcCDBFPh94C&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Juvenile Fiction"],
		},
		{
			title: "La vie est facile, ne t'inquiète pas",
			summary:
				"La suite de l'album Les gens heureux lisent et boivent du café adapté du roman d'AGNÈS MARTIN-LUGAND par Véronique Grisseaux et Cécile Bidault De retour d'Irlande, Diane est bien décidée à reconstruire sa vie à Paris. Avec l'aide de son ami Félix, elle se lance à corps perdu dans la reprise en main de son café littéraire. C'est là, au \" Gens heureux lisent et boivent du café \", qu'elle rencontre Olivier. Il comprend son refus d'être mère à nouveau. Car elle ne peut se remettre de la perte de sa petite fille. Bientôt, un événement inattendu va venir bouleverser les certitudes de Diane quant à ses choix pour lesquels elle a tant bataillé. Aura-t-elle le courage d'emprunter un autre chemin ?",
			year: 2023,
			isbn: "2749952247",
			authors: ["Agnès Martin-Lugand", "Véronique Grisseaux"],
			pages: 146,
			imageUrl:
				"http://books.google.com/books/content?id=q7XYEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Comics & Graphic Novels"],
		},
		{
			title: "Gone, Baby, Gone",
			summary:
				"“Powerful and raw, harrowing, and unsentimental.” —Washington Post Book World “Chilling, completely credible….[An] absolutely gripping story.” —Chicago Tribune “Mr. Lehane delivers big time.” —Wall Street Journal In Gone, Baby, Gone, the master of the new noir, New York Times bestselling authors Dennis Lehane (Mystic River, Shutter Island), vividly captures the complex beauty and darkness of working-class Boston. A gripping, deeply evocative thriller about the devastating secrets surrounding a little girl lost, featuring the popular detective team of Patrick Kenzie and Angela Gennaro, Gone, Baby, Gone was the basis for the critically acclaimed motion picture directed by Ben Affleck and starring Casey Affleck, Ed Harris, and Morgan Freeman.",
			year: 2009,
			isbn: "0061802735",
			authors: ["Dennis Lehane"],
			pages: 560,
			imageUrl:
				"http://books.google.com/books/content?id=a0He4Alb3ZIC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Shutter Island",
			summary:
				"The basis for the blockbuster motion picture directed by Martin Scorsese and starring Leonardo DiCaprio, Shutter Island by New York Times bestselling authors Dennis Lehane is a gripping and atmospheric psychological thriller where nothing is quite what it seem. U.S. Marshal Teddy Daniels has come to Shutter Island, home of Ashecliffe Hospital for the Criminally Insane, to find an escaped murderer named Rachel Solando. As a killer hurricane bears down on the island, the investigation deepens and the questions mount. How has a barefoot woman escaped from a locked room? Who is leaving them clues in the form of cryptic codes? And what really goes on in Ward C? The closer Teddy gets to the truth, the more elusive it becomes. And the more he begins to believe that he may never leave Shutter Island. Because someone is trying to drive him insane... Readers say: 'What a roller coaster ride. The book is just as good as the film' five star reader review 'A treat of a reveal and it's a great journey getting there' five star reader review 'Shutter Island held my attention from start to finish. Can't wait to read more of Lehane's work' five star reader review",
			year: 2010,
			isbn: "0748124802",
			authors: ["Dennis Lehane"],
			pages: 269,
			imageUrl:
				"http://books.google.com/books/content?id=VIPkHaY_FhUC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Dune",
			summary:
				"En 2020, Dune reste le roman de science-fiction le plus lu au monde. Plus de 50 ans après sa première publication en 1965, le texte de l'écrivain américain Frank Herbert continue de passionner et de fasciner les lecteurs du monde entier. S’il est plus distant de notre époque que ne l'est le premier pas de l'Homme sur la Lune, il évoque pourtant des thématiques qui continuent à avoir une forte résonance dans notre monde ; en 2020, Dune est ainsi toujours une œuvre d'actualité, aussi bien parce qu’elle s'est intéressée à des questions intemporelles que parce qu'elle a développé des pensées visionnaires, qui allaient par la suite occuper une place centrale dans l'actualité mondiale. L’ouvrage de Nicolas Allard a pour objectif de décrire, décrypter et analyser les grands thèmes présents dans Dune, tout en mettant en évidence la portée politique et philosophique de ce texte qui, tout en étant un grand roman d'aventures, pose des questions sur des thèmes aussi essentiels que le féminisme, l'écologie, le transhumanisme, la monstruosité et l'héroïsme. Il procédera également à une étude comparée entre Dune et Star Wars afin d’identifier leurs subtilités propres, puis évoquera en guise de conclusion les adaptations cinématographiques passées et futures de ce chef-d’œuvre de la SF. L’ouvrage sera illustré par une dizaine de dessins au trait d’Emmanuel Briaire.",
			year: 2020,
			isbn: "2100819232",
			authors: ["Nicolas Allard"],
			pages: 182,
			imageUrl:
				"http://books.google.com/books/content?id=3SEAEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Photography"],
		},
		{
			title: "Le meilleur des mondes et Retour au meilleur des mondes",
			summary:
				"Le chef d'œuvre d'Aldous Huxley Le Meilleur des Mondes, se lit et se relit, intemporel, visionnaire, absolument génial. Découvrez ou redécouvrez-le dans cette édition numérique inédite, suivi de Retour au meilleur des mondes, un texte plus pamphlétaire, écrit trente ans après l'œuvre originale dont il poursuit le propos. Le chef d'œuvre d'Aldous Huxley Le Meilleur des Mondes, se lit et se relit, intemporel, visionnaire, absolument génial. Découvrez ou redécouvrez-le dans cette édition numérique inédite, suivi de Retour au meilleur des mondes, un texte plus pamphlétaire, écrit trente ans après l'œuvre originale dont il poursuit le propos. Le Meilleur des Mondes 632 après Ford : désormais on compte les années à partir de l'invention de la voiture à moteur. La technologie et la science ont remplacé la liberté et Dieu. La vie humaine, anesthésiée, est une suite de satisfactions, les êtres naissent in vitro, les désirs s'assouvissent sans risque de reproduction, les émotions et les sentiments ont été remplacés par des sensations et des instincts programmés. La société de ce Meilleur des mondes est organisée, hiérarchisée et uniformisée, chaque être, rangé par catégorie, a sa vocation, ses capacités et ses envies, maîtrisées, disciplinées, accomplies. Chacun concourt à l'ordre général, c'est-à-dire travaille, consomme et meurt, sans jamais revendiquer, apprendre ou exulter. Mais un homme pourtant est né dans cette société, avec, chose affreuse, un père et une mère et, pire encore, des sentiments et des rêves. Ce \" Sauvage \", qui a lu tout Shakespeare et le cite comme une Bible, peut-il être un danger pour le \" monde civilisé \" ? Retour au meilleur des mondes Trente ans après Le Meilleur des mondes, Aldous Huxley revient sur ce roman phare de la science-fiction pour constater que l'évolution qu'il imaginait dans les années 1930 se révèle une véritable prédiction. Le monde qu'il a vu émerger – la dictature scientifique, l'homme transformé en esclave amoureux de sa servitude, la montée des fanatismes, le cauchemar de l'organisation intégrale – est déjà en train de prendre forme sous ses yeux à la fin des années 1950. Dans cet essai d'une étonnante lucidité, il nous offre un regard percutant sur les évolutions sociales et politiques de son temps.",
			year: 2015,
			isbn: "2259243517",
			authors: ["Aldous Huxley"],
			pages: 310,
			imageUrl:
				"http://books.google.com/books/content?id=eQzXCQAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Fiction"],
		},
		{
			title: "Ready player one - Tome 1",
			summary:
				"LE LIVRE QUI A INSPIRE LE DERNIER FILM DE STEVEN SPIELBERG L'avenir d'un monde en jeu, une quête pour la récompense suprême. Êtes-vous prêts ? 2045. La réalité est devenue insoutenable. Les rares moments pendant lesquels Wade Watts se sent vraiment exister sont ceux où il est connecté à l'OASIS, un vaste monde virtuel dans lequel la majeure partie de l'humanité passe son temps. Quand l'excentrique créateur de l'OASIS meurt, il laisse derrière lui une suite d'énigmes complexes inspirées par son obsession pour la pop culture des décennies passées. Le premier à les résoudre deviendra l'héritier de son immense fortune et, surtout, contrôlera l'OASIS. Et Wade résout la première énigme. Il est soudain assiégé de rivaux qui tueraient pour accéder au trésor. La course est lancée. Une seule façon d'y survivre : la gagner.",
			year: 2018,
			isbn: "2749935881",
			authors: ["Ernest Cline"],
			pages: 447,
			imageUrl:
				"http://books.google.com/books/content?id=iN1MDwAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
			genres: ["Literary Collections"],
		},
		{
			title: "1984",
			summary:
				"Winston Smith, obscur tâcheron au ministère de la Vérité, réécrit le passé et envoie dûment dans le vide-mémoire les documents devenus obsolètes. Le Parti a toujours raison et aucun fait ne doit le contredire. Comment penser, aimer, savourer la beauté ou dire que deux et deux font quatre dans un État qui a pris le contrôle de la réalité, de votre mémoire, de votre langue même ? La meilleure dystopie du XXe siècle, dans une nouvelle traduction illustrée.",
			year: 2021,
			isbn: "2035971217",
			authors: ["George Orwell"],
			pages: 256,
			imageUrl:
				"http://books.google.com/books/content?id=BFZlEAAAQBAJ&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
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
							where: {
								first_name_last_name: {
									// use the unique constraint name
									first_name,
									last_name,
								},
							},
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
							where: { category: category }, // champ UNIQUE
							create: { category: category },
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
				reading_status: "à lire",
			},
		});
	}

	console.log("✅ Seed complet exécuté correctement");
}

main()
	.catch(console.error)
	.finally(async () => await prisma.$disconnect());
