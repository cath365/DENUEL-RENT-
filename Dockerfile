# Use official Node image
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN corepack enable && corepack prepare pnpm@latest --activate || true
RUN npm ci --silent

# Copy rest of files and build
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
