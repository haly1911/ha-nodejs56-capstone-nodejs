FROM node:24.13.1-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN DATABASE_URL="mysql://user:password@localhost:3306/db" npx prisma generate
RUN npm run build

RUN npm prune --omit=dev

FROM node:24.13.1-alpine AS production

WORKDIR /app

COPY --from=build ./app/dist ./dist
COPY --from=build ./app/node_modules ./node_modules

CMD ["node", "dist/src/main"]