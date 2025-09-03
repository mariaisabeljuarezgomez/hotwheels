# Hot Wheels Velocity - Railway Deployment

# Use Python for serving static files
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# Start Python HTTP server
CMD ["python", "-m", "http.server", "3000"]
