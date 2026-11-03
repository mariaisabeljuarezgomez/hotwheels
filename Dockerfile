FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY storefront ./storefront
COPY HOT_WHEELS_IMAGES ./HOT_WHEELS_IMAGES
COPY video ./video
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "start"]
