FROM node:20-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install --production=false

# Copy source and build
COPY src/ ./src/
COPY tsconfig.json ./
COPY drizzle.config.ts ./

RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/ || exit 1

CMD ["sh", "-c", "PORT=${PORT:-3001} node dist/index.js"]
