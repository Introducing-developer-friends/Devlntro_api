FROM node:20.15.0
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD sh -c "sleep 20 &&NODE_ENV=production npm run migration:run:prod && node dist/main.js"
