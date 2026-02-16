# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and library source
COPY package.json ./
COPY public ./public
COPY src ./src
COPY vite.config.ts ./
COPY index.html ./

# Build the library
RUN npm install && npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

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
