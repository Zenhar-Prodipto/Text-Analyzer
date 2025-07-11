#!/bin/bash

# Text Analyzer - Development Environment Setup Script
set -e

echo "🚀 Setting up Text Analyzer for Development Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
fi

# Update NODE_ENV in .env for development
sed -i.bak 's/NODE_ENV=local/NODE_ENV=development/' .env

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p test/unit test/integration test/e2e

# Clean up previous containers and volumes
echo "🧹 Cleaning up previous containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans --volumes

# Build and start services
echo "🔧 Building and starting services..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up 

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 45

# Check service health
echo "🔍 Checking service health..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps | grep -q "unhealthy\|Exit"; then
        echo "⏳ Attempt $attempt/$max_attempts: Some services are still starting..."
        sleep 10
        attempt=$((attempt + 1))
    else
        echo "✅ All services are healthy!"
        break
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Some services failed to start properly. Check logs with: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs"
    exit 1
fi

echo "✅ development environment is ready!"
echo ""
echo "🌐 Application URLs:"
echo "   - Backend API: http://localhost:3000"
echo "   - API Documentation: http://localhost:3000/api/docs"
echo "   - Health Check: http://localhost:3000/api/v1/health"
echo "   - Keycloak Admin: http://localhost:8080 (admin/admin)"
echo ""
echo "🗄️  Database Connection:"
echo "   - Host: localhost"
echo "   - Port: 5432"
echo "   - Database: text_analyzer"
echo "   - Username: admin"
echo "   - Password: password"
echo ""
echo "📊 Redis Connection:"
echo "   - Host: localhost"
echo "   - Port: 6379"
echo ""
echo "🛠️  Useful Commands:"
echo "   - View logs: docker-compose -f docker-compose.yml -f docker-compose.local.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.yml -f docker-compose.local.yml down"
echo "   - Restart backend: docker-compose -f docker-compose.yml -f docker-compose.local.yml restart backend"
echo ""
echo "Happy coding! 🎉"