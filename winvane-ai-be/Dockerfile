# ==============================================================================
# Stage 1: Dependencies Installation
# ==============================================================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ==============================================================================
# Stage 2: Development Target (Hot-reload with bind-mounts)
# ==============================================================================
FROM node:22-alpine AS development
WORKDIR /app

RUN apk add --no-cache python3 py3-pip
COPY package*.json ./
COPY requirements-pdf.txt ./
COPY --from=deps /app/node_modules ./node_modules
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements-pdf.txt
ENV PATH="/opt/venv/bin:$PATH"
COPY . .

ENV NODE_ENV=development
EXPOSE 5173

CMD ["npm", "run", "start:dev"]

# ==============================================================================
# Stage 3: Build Target
# ==============================================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN npm prune --omit=dev

# ==============================================================================
# Stage 4: Production Target (Hardened, non-root)
# ==============================================================================
FROM node:22-alpine AS production
WORKDIR /app

# Install runtime dependencies for health checks and PDF text extraction.
RUN apk add --no-cache curl python3 py3-pip \
    && python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

ENV NODE_ENV=production

COPY requirements-pdf.txt ./
RUN pip install --no-cache-dir -r requirements-pdf.txt
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts/extract_company_brain.py ./scripts/extract_company_brain.py

USER node

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5173/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
