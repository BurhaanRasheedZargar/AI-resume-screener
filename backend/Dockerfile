FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma db push --skip-generate && node scripts/createAdmin.js && node src/server.js"]
