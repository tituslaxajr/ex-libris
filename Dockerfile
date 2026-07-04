# Ex Libris — self-hosted container.
# Debian slim (glibc) so libsql's native binding loads reliably.

# ---- build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime deps (prod only) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/data/exlibris.db \
    UPLOAD_DIR=/data/uploads

# Production node_modules and the built app.
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY package.json next.config.ts ./

# The volume lives here; run as an unprivileged user that owns it.
RUN mkdir -p /data/uploads && chown -R node:node /data /app
USER node

EXPOSE 3000
# Apply migrations against the mounted volume, then start the server.
CMD ["sh", "-c", "node scripts/migrate.mjs && node_modules/.bin/next start -p ${PORT}"]
