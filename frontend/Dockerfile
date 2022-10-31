FROM node:18.8.0

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

CMD ["npm", "start"]