FROM node:18.8.0

LABEL org.opencontainers.image.authors="marko.uksanovic1@gmail.com"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
