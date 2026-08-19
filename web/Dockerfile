FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --network-timeout=1000000

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
