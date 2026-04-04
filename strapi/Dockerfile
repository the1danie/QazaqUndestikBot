FROM node:24-alpine
WORKDIR /opt/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build
EXPOSE 1337
CMD ["npm", "run", "start"]
