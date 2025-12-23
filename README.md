# 🚀 Blablabook API - Backend Documentation

**🌐 English Version** | **🇫🇷 [Version Française](README_FR.md)**

## 📖 Overview

Blablabook API is a RESTful backend service built with Express.js, TypeScript, and Prisma ORM for a book management and social reading platform. The API provides comprehensive functionality for user authentication, book management, library tracking, comments, and social features.

## 🎯 Key Features

- **Authentication**: JWT-based auth with refresh tokens, Google OAuth
- **User Management**: Profiles, avatars, roles (user/admin)
- **Book Management**: CRUD operations, search, categories, authors
- **User Library**: Track reading status (à lire, en cours, lu), ratings
- **Social Features**: Comments, likes, replies
- **Admin Dashboard**: User management, content moderation
- **Email Services**: Password reset, notifications via Resend

## 🛠️ Technology Stack

- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 7.x with PostgreSQL
- **Authentication**: JWT, Argon2 for password hashing
- **Validation**: Zod schemas
- **Testing**: Vitest (unit & integration tests)
- **Documentation**: Swagger/OpenAPI
- **Code Quality**: Biome for linting/formatting
- **Containerization**: Docker with multi-arch support

## 📦 Project Structure

```
projet-blablabook-back/
├── src/
│   ├── controllers/       # Route handlers
│   ├── routers/           # Express route definitions
│   ├── middlewares/       # Authentication & error handling
│   ├── lib/               # Core utilities (auth, tokens, email, etc.)
│   ├── schemas/           # Zod validation schemas
│   ├── models/            # Database models & seeding
│   └── @types/            # TypeScript type definitions
├── prisma/                # Prisma schema & migrations
├── tests/                 # Unit & integration tests
└── config/                # Configuration files
```

## 🔧 Database Schema

The API uses PostgreSQL with the following main entities:

- **Users**: Email, password, profile info, avatars
- **Books**: ISBN, title, authors, genres, metadata
- **Authors & Genres**: Normalized entities with relationships
- **User Book Records**: Reading status, ratings, progress
- **Comments**: Nested comments with likes
- **Refresh Tokens**: Secure session management
- **Password Reset Tokens**: Secure password recovery

## 🚀 Getting Started

### 1. 📦 Install Dependencies

```bash
npm install
```

### 2. ⚙️ Configure Environment

Copy and edit the example files:

```bash
cp .env.docker.example .env.docker
cp .env.example .env
```

Required variables include:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `PORT` - API server port
- `ALLOWED_ORIGINS` - CORS configuration
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` - For Google OAuth
- `RESEND_API_KEY` - For email services

### 3. 🐳 Start Database with Docker

```bash
# Start PostgreSQL container
docker compose -p blablabook -f docker-compose.yml --env-file .env.docker up -d

# Stop container
docker compose -p blablabook -f docker-compose.yml --env-file .env.docker down
```

### 4. 💎 Prisma Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate

# Optional: Start Prisma Studio
npm run prisma:studio
```

### 5. ▶️ Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:PORT` (as configured in `.env`).

### 6. 🧪 Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

```

## 🔐 Authentication Flow

1. **Registration**: User creates account with email/password or Google OAuth
2. **Login**: Returns access token (short-lived) and refresh token (long-lived)
3. **Token Refresh**: Automatic refresh when access token expires
4. **Protected Routes**: Use `isAuth` middleware for authentication
5. **Admin Routes**: Use `isAdmin` middleware for role-based access

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Books
- `GET /api/books` - List all books
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Create book (admin only)
- `PUT /api/books/:id` - Update book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)

### User Library
- `GET /api/library` - Get user's library
- `POST /api/library` - Add book to library
- `PUT /api/library/:id` - Update reading status/rating
- `DELETE /api/library/:id` - Remove book from library

### Comments
- `GET /api/comments` - Get comments for book
- `POST /api/comments` - Create comment
- `POST /api/comments/:id/like` - Like comment
- `POST /api/comments/:id/reply` - Reply to comment

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

## 🌐 API Documentation

Swagger documentation is available at `/api-docs` when the server is running. The OpenAPI specification is auto-generated from JSDoc comments.

## 📊 Testing Strategy

### Unit Tests
- Middleware validation
- Token utilities
- Query builders
- Error handlers

### Integration Tests
- Authentication flows
- Book CRUD operations
- User library management
- Comment system
- Admin functionality

### Test Setup
```bash
# Reset test database
npm run reset-test-db

# Run tests in Docker
npm run test:docker
```

## 🛡️ Security Features

- **Password Hashing**: Argon2 for secure password storage
- **JWT Security**: Short-lived access tokens with refresh token rotation
- **CORS**: Configurable allowed origins
- **Input Validation**: Zod schemas for all requests
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Rate Limiting**: Built-in Express rate limiting

## 📦 Deployment

### Production Deployment

The API is automatically deployed to production via GitHub Actions on pushes to `main` branch:

1. **Build**: Multi-arch Docker image (linux/arm64)
2. **Push**: Image pushed to Docker Hub
3. **Migrate**: Database migrations applied
4. **Deploy**: New container started on production server

### CI/CD Pipeline

- **Test Job**: Runs all tests on every push
- **Deploy Job**: Deploys to production only on `main` branch
- **Rollback**: Automatic backup of previous container
- **Health Checks**: Container health monitoring

### Production Environment

- **Database**: Supabase PostgreSQL
- **Hosting**: Docker container on dedicated server
- **Domain**: `https://api.blablabook.space`
- **Monitoring**: Built-in Express health checks

## 📝 Code Quality

### Formatting & Linting

```bash
# Check code quality
npm run check

# Format code
npm run format

# Lint code
npm run lint
```

### Biome Configuration

- TypeScript support
- Prettier-compatible formatting
- ESLint-compatible linting
- Automatic fixes available

## 🔧 Development Scripts

```bash
# Development server with auto-restart
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database seeding
npm run db:seed

# Reset database (development only)
npm run prisma:reset
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run `npm run check` to verify code quality
5. Submit pull request to `dev` branch

## 📄 License

ISC License - See LICENSE file for details.

## 📬 Contact

For questions or support, please contact the Blablabook team.
