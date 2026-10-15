# Mirai Clubs - Production & Hackathon Demo Container
FROM python:3.9-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend /app/backend
COPY frontend /app/frontend

# Ensure storage directories
RUN mkdir -p /app/backend/uploads /app/backend/generated_certificates

WORKDIR /app/backend

EXPOSE 8000

# Start script: run seed then launch uvicorn
CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
