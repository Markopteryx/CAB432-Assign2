FROM node:18.8.0

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 80

CMD ["./node_modules/.bin/serve", "-s","build"]