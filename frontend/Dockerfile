FROM node:18.8.0

LABEL org.opencontainers.image.authors="marko.uksanovic1@gmail.com"

ENV AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]