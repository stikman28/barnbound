# Production image for the BarnBound web app (Next.js 16).
# Build context is ./web (see render.yaml: dockerContext).
FROM node:26-slim

# OpenSSL keeps Prisma CLI (generate/migrate) quiet and happy.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (build needs the dev deps too).
COPY package.json package-lock.json ./
RUN npm ci

# App source + generated Prisma client + production build.
COPY . .
RUN npx prisma generate
# A placeholder URL lets `next build` import server modules without a real DB.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm run build

ENV NODE_ENV=production
EXPOSE 3000

# On each deploy: apply migrations, then start. Render injects $PORT.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -p ${PORT:-3000} -H 0.0.0.0"]
