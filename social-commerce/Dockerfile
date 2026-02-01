# Multi-stage Dockerfile for Social Commerce App
# Contains both backend (FastAPI) and frontend (React/Vite)
# Exposes port 80 for frontend, proxies /api to backend

# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY front-end/package.json front-end/package-lock.json* ./

# Install dependencies
RUN npm ci --silent

# Copy frontend source
COPY front-end/ ./

# Build production assets
RUN npm run build

# =============================================================================
# Stage 2: Production Image
# =============================================================================
FROM python:3.12-slim

# Install nginx, supervisor, and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# =============================================================================
# Backend Setup
# =============================================================================
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

# =============================================================================
# Frontend Setup - Copy built assets from builder stage
# =============================================================================
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# =============================================================================
# Nginx Configuration
# =============================================================================
RUN rm /etc/nginx/sites-enabled/default

COPY <<'EOF' /etc/nginx/sites-available/app.conf
server {
    listen 80;
    server_name _;

    # Serve frontend static files
    root /usr/share/nginx/html;
    index index.html;

    # Frontend routes - SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket connections
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
EOF

RUN ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/

# =============================================================================
# Supervisor Configuration - Run both nginx and uvicorn
# =============================================================================
COPY <<'EOF' /etc/supervisor/conf.d/app.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=PYTHONUNBUFFERED="1"
EOF

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

# Expose frontend port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start supervisor (manages both nginx and backend)
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
