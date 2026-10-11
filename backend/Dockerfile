FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./
COPY src ./src
# scripts/seed.js opsional, tidak ikut image prod
# loggerService buat ./logs saat start; COPY milik root, jadi siapkan dulu milik node.
RUN mkdir -p /app/logs && chown node:node /app/logs
EXPOSE 3000
USER node
CMD ["node", "server.js"]
