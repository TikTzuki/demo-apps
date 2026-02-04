# Multi-stage Dockerfile for Social Commerce App
# Contains both backend (FastAPI) and frontend (React/Vite)
# Runs frontend with Vite dev server, proxies /api to backend

# =============================================================================
# Production Image
# =============================================================================
FROM python:3.12-slim

# Install supervisor, curl, and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
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
# Frontend Setup - Install dependencies and copy source
# =============================================================================
COPY front-end/package.json front-end/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm ci --silent

COPY front-end/ ./

WORKDIR /app

# =============================================================================
# Supervisor Configuration - Run backend and frontend dev server
# =============================================================================
COPY <<'EOF' /etc/supervisor/conf.d/app.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

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

[program:frontend]
command=npm run dev
directory=/app/frontend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

# Expose frontend port
EXPOSE 3000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start supervisor (manages backend and frontend)
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
