FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN ["npm", "ci"]

COPY . .

EXPOSE 5001

CMD ["npm", "run", "start"]
