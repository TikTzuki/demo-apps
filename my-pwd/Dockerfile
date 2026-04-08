FROM rust:1.85-slim AS builder

WORKDIR /app
COPY . .
RUN cargo build --release -p my-pwd-server

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/my-pwd /usr/local/bin/my-pwd
COPY --from=builder /app/crates/server/static /app/static

WORKDIR /app
ENV STATIC_DIR=/app/static
EXPOSE 3000

CMD ["my-pwd"]
