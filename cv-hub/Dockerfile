# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ENV NEXT_PUBLIC_API_URL=""

RUN npm run build


# ── Stage 2: Final image ────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-venv \
        supervisor \
        libpq5 \
        gcc \
        libpq-dev \
        python3-dev \
    && rm -rf /var/lib/apt/lists/*

# ── Backend: build venv in-place ──
WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

RUN mkdir -p /app/backend/uploads

# Remove build deps
RUN apt-get purge -y gcc python3-dev libpq-dev && apt-get autoremove -y

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV UPLOAD_DIR=/app/backend/uploads

# ── Frontend ──
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/next.config.js ./
COPY frontend/tsconfig.json ./
COPY frontend/tailwind.config.ts ./
COPY frontend/postcss.config.js ./
COPY frontend/src ./src
COPY --from=frontend-build /app/frontend/.next ./.next
COPY --from=frontend-build /app/frontend/node_modules ./node_modules

# ── Supervisor (2 processes: backend + frontend) ──
COPY <<'SUPERVISOR' /etc/supervisor/conf.d/cv-hub.conf
[supervisord]
nodaemon=true
logfile=/dev/stdout
logfile_maxbytes=0

[program:backend]
command=/opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:frontend]
command=npx next start -p 3000
directory=/app/frontend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
SUPERVISOR

WORKDIR /app

EXPOSE 3000

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/cv-hub.conf"]
