FROM node:14-alpine
WORKDIR /usr/app
COPY . .
RUN npm install --quite
RUN npm start