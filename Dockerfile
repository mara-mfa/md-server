FROM node:8-alpine
WORKDIR /usr/src/app

COPY . .
RUN npm install
RUN npm prune --only=production

EXPOSE 8080
CMD [ "npm", "start" ]
