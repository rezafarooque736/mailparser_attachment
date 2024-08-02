FROM node:20

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN npm install

COPY . .

EXPOSE 8001

CMD [ "node", "src/index.js" ]