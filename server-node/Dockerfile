# Build context is the REPO ROOT (see docker-compose.yml) so the server can
# copy the shared Zod schemas it imports across the boundary (../src/schemas).
FROM node:22-alpine

WORKDIR /app

# Shared contracts — imported by server-node/src/schemas.ts.
COPY src/schemas ./src/schemas

# Server sources + manifest.
COPY server-node/package.json ./server-node/package.json
WORKDIR /app/server-node
RUN npm install --no-audit --no-fund
COPY server-node/ ./

ENV PORT=8787
EXPOSE 8787

# tsx runs the TypeScript entry directly — no separate build step for this
# reference archetype. Swap for a tsc build if you want a leaner image.
CMD ["npm", "start"]
