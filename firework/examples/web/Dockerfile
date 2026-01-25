# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and library source
COPY package.json tsconfig.json tsup.config.ts ./
COPY src ./src

# Build the library
RUN npm install && npm run build

# Copy example app
WORKDIR /app/example
COPY examples/web/package.json ./
COPY examples/web/vite.config.ts ./
COPY examples/web/index.html ./
COPY examples/web/src ./src

# Install example dependencies (excluding the workspace dependency)
RUN npm install

# Manually copy the built library
RUN mkdir -p node_modules/@tiktuzki/firework && \
    cp -r /app/dist node_modules/@tiktuzki/firework/ && \
    cp /app/package.json node_modules/@tiktuzki/firework/

# Build the example app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/example/dist /usr/share/nginx/html

# Add nginx configuration for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
