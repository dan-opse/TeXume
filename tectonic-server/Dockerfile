FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libssl3 \
    libfontconfig1 \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Tectonic
RUN curl -fsSL https://drop.fullyjustified.net/tectonic.sh | sh \
    && mv tectonic /usr/local/bin/ \
    || (curl -L --retry 3 \
    "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz" \
    -o /tmp/tectonic.tar.gz \
    && tar -xzf /tmp/tectonic.tar.gz -C /usr/local/bin \
    && rm /tmp/tectonic.tar.gz)

WORKDIR /app

# Copy and install the tiny server
COPY server.js .

EXPOSE 9292

CMD ["node", "server.js"]
