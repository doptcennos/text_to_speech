FROM node:20-alpine

WORKDIR /app

# Cache and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 8001

# Serve production build using Vite preview without Nginx
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8001"]
