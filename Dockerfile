# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    gcc \
    build-essential \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Create entrypoint script with proper Unix line endings
RUN echo '#!/bin/sh' > /app/entrypoint_new.sh && \
    echo '' >> /app/entrypoint_new.sh && \
    echo 'echo "Applying database migrations..."' >> /app/entrypoint_new.sh && \
    echo 'python manage.py migrate' >> /app/entrypoint_new.sh && \
    echo '' >> /app/entrypoint_new.sh && \
    echo 'echo "Collecting static files..."' >> /app/entrypoint_new.sh && \
    echo 'python manage.py collectstatic --noinput' >> /app/entrypoint_new.sh && \
    echo '' >> /app/entrypoint_new.sh && \
    echo 'echo "Starting Gunicorn..."' >> /app/entrypoint_new.sh && \
    echo 'exec gunicorn core.wsgi:application --bind 0.0.0.0:8000' >> /app/entrypoint_new.sh && \
    chmod +x /app/entrypoint_new.sh

# Use the newly created entrypoint
ENTRYPOINT ["/app/entrypoint_new.sh"]
CMD []
