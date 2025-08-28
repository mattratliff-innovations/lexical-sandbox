#!/bin/bash

# Hard restart nginx to ensure new configuration is loaded

echo "🔄 Hard Restart nginx with CORS Fix"
echo "==================================="
echo ""

# Step 1: Kill all nginx processes
echo "🛑 Killing all nginx processes..."

# Find all nginx processes
NGINX_PIDS=$(pgrep nginx)
if [ ! -z "$NGINX_PIDS" ]; then
    echo "Found nginx processes: $NGINX_PIDS"
    
    # Try graceful shutdown first
    sudo nginx -s quit 2>/dev/null || true
    sleep 3
    
    # Force kill if still running
    if pgrep nginx > /dev/null; then
        echo "Force killing nginx processes..."
        sudo pkill -9 nginx
        sleep 2
    fi
    
    # Verify all processes are gone
    if pgrep nginx > /dev/null; then
        echo "❌ Some nginx processes still running:"
        ps aux | grep nginx | grep -v grep
    else
        echo "✅ All nginx processes stopped"
    fi
else
    echo "✅ No nginx processes running"
fi

echo ""

# Step 2: Clean up any leftover files
echo "🧹 Cleaning up nginx state..."
sudo rm -f /var/run/nginx.pid 2>/dev/null || true
sudo rm -f /tmp/nginx.pid 2>/dev/null || true

# Step 3: Test configuration
echo "🔍 Testing nginx configuration..."
if nginx -t -c "$(pwd)/nginx/nginx.conf" 2>/dev/null; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration has errors:"
    nginx -t -c "$(pwd)/nginx/nginx.conf"
    exit 1
fi

echo ""

# Step 4: Check port availability
echo "🔍 Checking if port 8010 is available..."
if lsof -Pi :8010 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 8010 is still in use:"
    lsof -Pi :8010 -sTCP:LISTEN
    echo ""
    echo "🔧 Attempting to free the port..."
    sudo fuser -k 8010/tcp 2>/dev/null || true
    sleep 2
fi

if lsof -Pi :8010 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 8010 is still in use. Please free it manually."
    exit 1
else
    echo "✅ Port 8010 is available"
fi

echo ""

# Step 5: Start nginx with fresh configuration
echo "🚀 Starting nginx with fresh configuration..."
echo "Config file: $(pwd)/nginx/nginx.conf"

sudo nginx -c "$(pwd)/nginx/nginx.conf"

if [ $? -eq 0 ]; then
    echo "✅ nginx started successfully"
    
    # Wait for full startup
    sleep 3
    
    # Verify it's running
    if curl -s -f http://localhost:8010/health > /dev/null; then
        echo "✅ nginx is responding on port 8010"
        
        # Show process info
        echo ""
        echo "📊 nginx process info:"
        ps aux | grep nginx | grep -v grep
        
    else
        echo "❌ nginx is not responding"
        echo "📋 Checking logs..."
        tail -5 /tmp/nginx_languagetool_error.log 2>/dev/null || echo "No error log found"
    fi
    
else
    echo "❌ Failed to start nginx"
    echo "📋 Check error log:"
    tail -10 /tmp/nginx_languagetool_error.log 2>/dev/null || echo "No error log found"
    exit 1
fi

echo ""

# Step 6: Test CORS headers specifically
echo "🧪 Testing CORS Headers"
echo "======================="

echo "📋 Testing preflight OPTIONS request..."

CORS_RESPONSE=$(curl -s -I -X OPTIONS \
    -H "Origin: http://localhost:3080" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Authorization, Content-Type" \
    http://localhost:8010/v2/check 2>/dev/null)

echo "Raw CORS response:"
echo "---"
echo "$CORS_RESPONSE"
echo "---"

# Check for duplicate Access-Control-Allow-Origin headers
echo ""
echo "🔍 Checking for duplicate headers..."

ORIGIN_HEADERS=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin")
ORIGIN_COUNT=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')

echo "Access-Control-Allow-Origin headers found: $ORIGIN_COUNT"
if [ "$ORIGIN_COUNT" -gt 0 ]; then
    echo "$ORIGIN_HEADERS"
fi

if [ "$ORIGIN_COUNT" = "1" ]; then
    echo "✅ Perfect! Only one Access-Control-Allow-Origin header"
elif [ "$ORIGIN_COUNT" = "0" ]; then
    echo "⚠️  No Access-Control-Allow-Origin header found"
else
    echo "❌ Still found $ORIGIN_COUNT Access-Control-Allow-Origin headers (should be 1)"
fi

echo ""

# Step 7: Test actual POST request
echo "📋 Testing actual POST request with CORS..."

POST_RESPONSE=$(curl -s -I -X POST \
    -H "Origin: http://localhost:3080" \
    -H "Authorization: Bearer $(cat token.txt 2>/dev/null || echo 'test-token')" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    http://localhost:8010/v2/check 2>/dev/null)

echo "POST request CORS headers:"
echo "---"
echo "$POST_RESPONSE" | grep -i "access-control" || echo "No CORS headers found"
echo "---"

# Final verification
POST_ORIGIN_COUNT=$(echo "$POST_RESPONSE" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')

echo ""
echo "📊 Final CORS Status:"
echo "===================="
echo "OPTIONS request headers: $ORIGIN_COUNT"
echo "POST request headers: $POST_ORIGIN_COUNT"

if [ "$ORIGIN_COUNT" = "1" ] && [ "$POST_ORIGIN_COUNT" = "1" ]; then
    echo "🎉 SUCCESS! CORS headers are properly configured"
    echo ""
    echo "💡 Your frontend should now work without CORS errors!"
    echo "🔧 Try your frontend request again"
    
elif [ "$ORIGIN_COUNT" -gt 1 ] || [ "$POST_ORIGIN_COUNT" -gt 1 ]; then
    echo "❌ Still seeing duplicate CORS headers"
    echo ""
    echo "💡 The issue might be:"
    echo "1. LanguageTool server itself is adding CORS headers"
    echo "2. Multiple nginx config files are being loaded"
    echo "3. Browser cache needs clearing"
    echo ""
    echo "🔧 Additional steps to try:"
    echo "• Clear browser cache completely"
    echo "• Check if LanguageTool has CORS settings"
    echo "• Verify only one nginx config is loaded"
    
else
    echo "⚠️  CORS headers missing - check nginx configuration"
fi

echo ""
echo "📝 Management commands:"
echo "   Check nginx status: ps aux | grep nginx"
echo "   View error logs: tail -f /tmp/nginx_languagetool_error.log"
echo "   Stop nginx: sudo nginx -s quit"
echo "   Test config: nginx -t -c $(pwd)/nginx/nginx.conf"