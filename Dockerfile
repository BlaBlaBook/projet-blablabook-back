FROM node:20-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache bash

# Copy package.json first for caching
COPY package.json package-lock.json* ./

# Install all deps (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client before building TypeScript
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Run migrations (optional if needed at runtime)
RUN npx prisma migrate deploy

# Expose API port
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
