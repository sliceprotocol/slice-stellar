FROM rust:1.81-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    pkg-config \
    libssl-dev \
  && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown
RUN cargo install --locked soroban-cli

WORKDIR /workspace/contracts
COPY slice ./slice

WORKDIR /workspace/contracts/slice

CMD ["/bin/sh", "-c", "soroban contract build && soroban contract optimize --wasm target/wasm32-unknown-unknown/release/slice.wasm"]
