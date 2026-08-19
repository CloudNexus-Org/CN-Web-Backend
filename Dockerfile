# cn-backend — Express + TypeScript + Mongoose (MongoDB)

# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install all dependencies (including devDependencies required for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build TypeScript output to dist/
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build

# ---- Production Runner Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    MONGODB_URI=mongodb://db:27017/cloudnexus

# Install wget for healthcheck & set up non-root expressjs user
RUN apk add --no-cache wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Install ONLY production dependencies (strips devDependencies like typescript, jest, tsx)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS files from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory and set permissions for expressjs user
RUN mkdir -p uploads && chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/index.js"]