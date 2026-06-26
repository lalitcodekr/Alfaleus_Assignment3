FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/
COPY tsconfig.json ./

RUN npx tsc --outDir dist --noEmit false 2>/dev/null || npm run build

EXPOSE 3001

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/ || exit 1

CMD ["node", "dist/index.js"]
