#!/bin/bash

# Text Analyzer - Production Environment Setup Script
set -e

echo "🚀 Setting up Text Analyzer for Production Environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with production configuration."
    echo "💡 You can copy from .env.example: cp .env.example .env"
    exit 1
fi

# Validate critical environment variables
echo "🔍 Validating environment variables..."

# Check if production environment is set
if ! grep -q "NODE_ENV=production" .env; then
    echo "⚠️  NODE_ENV is not set to production. Updating..."
    sed -i.bak 's/NODE_ENV=.*/NODE_ENV=production/' .env
fi

# Validate critical variables
required_vars=("DATABASE_PASSWORD" "JWT_SECRET" "KEYCLOAK_CLIENT_SECRET")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env || grep -q "^$var=.*change.*" .env; then
        echo "❌ $var is not properly configured for production!"
        echo "   Please set a secure value for $var in .env file"
        exit 1
    fi
done

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
chmod 755 logs

# Security check - ensure proper permissions
echo "🔒 Setting up security configurations..."
chmod 600 .env

# Clean up any existing containers and volumes (production safety)
echo "🧹 Cleaning up previous containers..."
read -p "⚠️  This will remove existing containers and volumes. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user."
    exit 1
fi

docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans --volumes

# Build images with no cache for production
echo "🔧 Building production images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Start services in production mode
echo "🚀 Starting production services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up 

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 60

# Extended health check for production
echo "🔍 Performing comprehensive health checks..."
max_attempts=15
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "⏳ Health check attempt $attempt/$max_attempts..."
    
    # Check if all services are running
    if docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps | grep -q "Exit\|Restarting"; then
        echo "⚠️  Some services are not running properly..."
        sleep 10
        attempt=$((attempt + 1))
        continue
    fi
    
    # Check backend health endpoint
    if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed!"
        break
    else
        echo "⏳ Backend not ready yet..."
        sleep 10
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Production deployment failed. Services are not healthy."
    echo "🔍 Check logs with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs"
    echo "🔍 Check service status: docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps"
    exit 1
fi

# Verify service resources
echo "📊 Checking service resources..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep text-analyzer

# Security verification
echo "🔒 Performing security verification..."
if docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend whoami | grep -q "nestjs"; then
    echo "✅ Backend is running as non-root user"
else
    echo "⚠️  Backend might not be running as non-root user"
fi

echo ""
echo "🎉 Production environment is ready!"
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
echo ""
echo "📊 Redis Connection:"
echo "   - Host: localhost"
echo "   - Port: 6379"
echo ""
echo "🛠️  Production Commands:"
echo "   - View logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "   - Restart backend: docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend"
echo "   - Service status: docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps"
echo "   - Resource usage: docker stats"
echo ""
echo "🔒 Security Notes:"
echo "   - Ensure your .env file has secure passwords"
echo "   - Consider using Docker secrets for sensitive data"
echo "   - Monitor logs regularly: tail -f logs/application.log"
echo "   - Set up proper firewall rules"
echo "   - Use HTTPS in production with reverse proxy"
echo ""
echo "📈 Monitoring:"
echo "   - Check service health: curl http://localhost:3000/api/v1/health"
echo "   - Monitor resource usage: docker stats"
echo "   - Check application logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend"
echo ""
echo "Production deployment complete! 🎊"