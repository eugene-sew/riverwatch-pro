# ─────────────────────────────────────────────────────────────
# RiverWatch PRO — Backend Dockerfile
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim

LABEL maintainer="RiverWatch PRO"
LABEL description="RiverWatch PRO Flask + SocketIO backend"

# Prevent Python from writing .pyc files and enable unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps needed for pyserial + eventlet
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libc-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create data directory for SQLite database volume mount
RUN mkdir -p /app/data

EXPOSE 9100

CMD ["python", "app.py"]
