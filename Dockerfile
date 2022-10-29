FROM node:19-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clear --force

COPY . .

CMD ["node", "src/index.js"]
