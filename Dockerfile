FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# pnpm, pinned by "packageManager" in package.json
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .

EXPOSE 8080
CMD ["node", "src/index.js"]
