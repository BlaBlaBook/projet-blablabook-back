FROM node:20-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache bash

# Copy package.json first for caching
COPY package.json package-lock.json* ./

# Install all deps
RUN npm install

# Copy source code
COPY . .

# Set build-time environment variable
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma client BEFORE building TypeScript
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Run migrations (optional at runtime)
RUN npx prisma migrate deploy

# Expose API port
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
