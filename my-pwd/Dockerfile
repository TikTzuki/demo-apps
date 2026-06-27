FROM rust:1.92-slim-bookworm AS builder

ARG TARGETARCH
ARG BINARY

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libssl-dev \
    ca-certificates \
    build-essential \
    pkg-config \
    libgmp-dev \
    && rm -rf /var/lib/apt/lists/*

RUN case "$TARGETARCH" in \
      amd64) echo "export OPENSSL_LIB_DIR=/usr/lib/x86_64-linux-gnu" > /tmp/env.sh ;; \
      arm64) echo "export OPENSSL_LIB_DIR=/usr/lib/aarch64-linux-gnu" > /tmp/env.sh ;; \
      *) echo "Unsupported arch: $TARGETARCH" && exit 1 ;; \
    esac

WORKDIR /app
COPY . .
RUN cargo build --release -p my-pwd-server

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/my-pwd /usr/local/bin/my-pwd
COPY --from=builder /app/crates/server/static /app/static

WORKDIR /app
ENV STATIC_DIR=/app/static
EXPOSE 3000

CMD ["my-pwd"]
