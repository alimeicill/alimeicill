FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# next.config.ts'deki /api yönlendirmesi build sırasında sabitlenir.
ARG API_URL=http://backend:4000
ENV API_URL=$API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3100
CMD ["npm", "start"]
