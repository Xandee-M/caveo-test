FROM node:20.17

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Instale as dependências
RUN npm install -g npm@latest

RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
