FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --production && npm cache clear --force

COPY . .

CMD ["node", "src/index.js"]
