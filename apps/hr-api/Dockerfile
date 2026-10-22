FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@11.19.0

# Copy workspace configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/hr-api ./apps/hr-api

# Install dependencies and generate prisma client
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @peoplepay360/db exec prisma generate

EXPOSE 3001

CMD ["pnpm", "--filter", "@peoplepay360/hr-api", "dev"]
