FROM node:18.8.0

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 80

RUN chmod +x entrypoint.sh

ENTRYPOINT [ "bash", "-c", "entrypoint.sh"]

CMD ["/frontend/node_modules/.bin/serve", "-s", "build"]