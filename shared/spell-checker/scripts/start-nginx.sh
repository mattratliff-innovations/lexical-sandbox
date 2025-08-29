#!/bin/bash

# Start nginx proxy for LanguageTool JWT authentication

echo "🌐 Starting nginx Proxy for JWT Authentication"
echo "=============================================="
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx is not installed!"
#     echo ""
#     echo "📥 Install nginx:"
#     echo ""
#     if [[ "$OSTYPE" == "darwin"* ]]; then
#         echo "macOS:"
#         echo "  brew install nginx"
#     elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
#         echo "Ubuntu/Debian:"
#         echo "  sudo apt update && sudo apt install nginx"
#         echo ""
#         echo "CentOS/RHEL/Fedora:"
#         echo "  sudo dnf install nginx"
#     fi
#     echo ""
    exit 1
fi

echo "✅ nginx found: $(nginx -v 2>&1)"
echo ""

# Check if nginx config exists
if [ ! -f "nginx/nginx.conf" ]; then
    echo "❌ nginx configuration not found!"
    echo "Expected: nginx/nginx.conf"
    echo ""
    echo "Please create the nginx directory and configuration file:"
    echo "  mkdir -p nginx"
    echo "  # Copy the nginx.conf from the artifacts"
    exit 1
fi
 
echo "📝 nginx configuration: nginx/nginx.conf"

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
if nginx -t -c "$(pwd)/nginx/nginx.conf" 2>/dev/null; then
    echo "✅ nginx configuration is valid"
else
    echo "❌ nginx configuration has errors:"
    echo ""
    nginx -t -c "$(pwd)/nginx/nginx.conf"
    echo ""
    echo "💡 Fix the configuration errors above and try again"
    exit 1
fi

# Check if port 8010 is available
if lsof -Pi :8010 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 8010 is already in use:"
    lsof -Pi :8010 -sTCP:LISTEN
    echo ""
    
    # Check if it's nginx already running
    EXISTING_NGINX=$(ps aux | grep nginx | grep -v grep | head -1)
    if [ ! -z "$EXISTING_NGINX" ]; then
        echo "🔄 Stopping existing nginx..."
        # sudo nginx -s quit 2>/dev/null || sudo nginx -s stop 2>/dev/null || true
        # sleep 2
    else
        echo "❌ Another service is using port 8010. Please stop it first."
        exit 1
    fi
fi

# Check if required services are running
echo "🔍 Checking prerequisite services..."

# Check JWT Validator
if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ JWT Validator is running on port 3001"
else
    echo "❌ JWT Validator is not running on port 3001"
    echo "💡 Start it first: cd jwt-validator && npm start"
    exit 1
fi

# Check LanguageTool
if curl -s -f -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "text=test&language=en-US" http://localhost:8081/v2/check > /dev/null 2>&1; then
    echo "✅ LanguageTool is running on port 8081"
else
    echo "❌ LanguageTool is not running on port 8081"
    echo "💡 Start it first with your LanguageTool startup script"
    exit 1
fi

echo ""

# Start nginx
echo "🚀 Starting nginx proxy..."
echo "📋 Configuration: $(pwd)/nginx/nginx.conf"
echo "🌐 Proxy will be available on: http://localhost:8010"
echo ""

# Start nginx with our configuration
# sudo nginx -c "$(pwd)/nginx/nginx.conf"
nginx -c "$(pwd)/nginx/nginx.conf"

if [ $? -eq 0 ]; then
    echo "✅ nginx started successfully!"
    echo ""
    
    # Wait a moment for nginx to fully start
    sleep 2
    
    # Test if nginx is responding
    echo "🔍 Testing nginx proxy..."
    if curl -s -f http://localhost:8010/health > /dev/null 2>&1; then
        echo "✅ nginx proxy is responding on port 8010"
        echo ""
        echo "🎉 JWT Authentication is now ENABLED!"
        echo ""
        echo "📋 Available endpoints:"
        echo "   • Direct LanguageTool (no auth): http://localhost:8081/v2/check"
        echo "   • Authenticated API: http://localhost:8010/v2/check"
        echo "   • JWT Validator: http://localhost:3001"
        echo "   • nginx Health: http://localhost:8010/health"
        echo ""
        echo "🧪 Test authentication:"
        echo "   ./complete-auth-test.sh"
        echo ""
        echo "🛑 Stop nginx:"
        echo "   sudo nginx -s quit"
        
    else
        echo "❌ nginx started but is not responding properly"
        echo "📋 Check nginx error log:"
        echo "   sudo tail -f /var/log/nginx/error.log"
    fi
    
else
    echo "❌ Failed to start nginx"
    echo ""
    echo "💡 Common issues:"
    echo "   1. Permission denied - make sure you're using sudo"
    echo "   2. Port already in use - check with: lsof -i :8010"
    echo "   3. Configuration errors - test with: nginx -t -c $(pwd)/nginx/nginx.conf"
    echo "   4. Log file permissions - check /var/log/nginx/"
fi

echo ""
echo "📋 Management commands:"
echo "   Start:   sudo nginx -c $(pwd)/nginx/nginx.conf"
echo "   Stop:    sudo nginx -s quit"
echo "   Reload:  sudo nginx -s reload"
echo "   Test:    nginx -t -c $(pwd)/nginx/nginx.conf"
echo "   Status:  ps aux | grep nginx"