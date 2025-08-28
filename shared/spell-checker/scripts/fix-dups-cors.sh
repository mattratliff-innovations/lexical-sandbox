#!/bin/bash

# Fix duplicate CORS headers by removing them from LanguageTool and letting nginx handle CORS

echo "🔧 Fixing Duplicate CORS Headers"
echo "================================="
echo ""
echo "Problem: Both LanguageTool AND nginx are adding CORS headers"
echo "Solution: Remove CORS from LanguageTool, let nginx handle it"
echo ""

# Step 1: Stop LanguageTool
echo "🛑 Stopping LanguageTool server..."

LT_PID=$(pgrep -f "languagetool-server.*HTTPServer" | head -n 1)
if [ ! -z "$LT_PID" ]; then
    echo "Found LanguageTool process (PID: $LT_PID)"
    kill $LT_PID
    
    # Wait for it to stop
    sleep 3
    
    if pgrep -f "languagetool-server.*HTTPServer" > /dev/null; then
        echo "Force killing LanguageTool..."
        pkill -9 -f "languagetool-server.*HTTPServer"
        sleep 2
    fi
    
    echo "✅ LanguageTool stopped"
else
    echo "✅ LanguageTool was not running"
fi

# Step 2: Find LanguageTool JAR
echo ""
echo "📦 Finding LanguageTool JAR..."

LANGUAGETOOL_JAR=""
POSSIBLE_LOCATIONS=(
    "languagetool/languagetool-server.jar"
    "languagetool-server.jar"
    "languagetool/target/languagetool-server.jar"
)

for location in "${POSSIBLE_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        LANGUAGETOOL_JAR="$location"
        echo "✅ Found JAR at: $location"
        break
    fi
done

if [ -z "$LANGUAGETOOL_JAR" ]; then
    echo "❌ LanguageTool JAR not found!"
    echo "💡 Please ensure the JAR is in one of these locations:"
    for location in "${POSSIBLE_LOCATIONS[@]}"; do
        echo "   - $location"
    done
    exit 1
fi

# Step 3: Start LanguageTool WITHOUT CORS headers
echo ""
echo "🚀 Starting LanguageTool WITHOUT CORS headers..."
echo "   (nginx will handle CORS instead)"

mkdir -p logs

# Start LanguageTool without --allow-origin parameter
nohup java -Xms256m -Xmx1g \
    -Djava.awt.headless=true \
    -Dfile.encoding=UTF-8 \
    -cp "$LANGUAGETOOL_JAR" \
    org.languagetool.server.HTTPServer \
    --port 8081 \
    --public \
    --maxTextLength 50000 \
    > logs/languagetool-no-cors.log 2>&1 &

NEW_LT_PID=$!
echo $NEW_LT_PID > logs/languagetool.pid

echo "✅ LanguageTool started without CORS (PID: $NEW_LT_PID)"
echo "📝 Log file: logs/languagetool-no-cors.log"

# Wait for LanguageTool to start
echo ""
echo "⏳ Waiting for LanguageTool to start..."
sleep 10

# Test LanguageTool
for i in {1..12}; do
    if curl -s -f -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "text=test&language=en-US" http://localhost:8081/v2/check > /dev/null; then
        echo "✅ LanguageTool is responding (took $((i * 5)) seconds)"
        break
    fi
    
    if [ $i -eq 12 ]; then
        echo "❌ LanguageTool failed to start within 60 seconds"
        echo "📋 Check logs: tail -f logs/languagetool-no-cors.log"
        exit 1
    fi
    
    echo -n "."
    sleep 5
done

# Step 4: Update nginx configuration to hide any remaining LanguageTool CORS headers
echo ""
echo "📝 Updating nginx to hide any remaining LanguageTool CORS headers..."

# Backup current nginx config
cp nginx/nginx.conf nginx/nginx.conf.pre-cors-fix

# Create new nginx config that explicitly hides upstream CORS headers
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    # Inline mime types
    types {
        text/html                             html htm shtml;
        text/css                              css;
        application/javascript                js;
        application/json                      json;
        text/plain                           txt;
        application/xml                       xml;
        application/x-www-form-urlencoded    form;
    }
    
    default_type application/octet-stream;
    
    # Logging
    access_log /tmp/nginx_languagetool_access.log;
    error_log /tmp/nginx_languagetool_error.log warn;
    
    # Basic settings
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10M;

    # Upstream servers
    upstream languagetool {
        server 127.0.0.1:8081 max_fails=3 fail_timeout=30s;
    }
    
    upstream jwt_validator {
        server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 8010;
        server_name localhost;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "nginx proxy healthy\n";
            add_header Content-Type text/plain;
        }

        # Main LanguageTool endpoint with JWT authentication
        location /v2/check {
            # Handle preflight requests FIRST
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }

            # JWT Authentication
            auth_request /auth;
            
            # Hide any CORS headers from LanguageTool upstream
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;
            
            # Forward to LanguageTool server
            proxy_pass http://languagetool;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Add our own CORS headers (after hiding upstream ones)
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
            
            # Proxy timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Internal auth endpoint
        location = /auth {
            internal;
            proxy_pass http://jwt_validator/validate-token;
            proxy_pass_request_body off;
            proxy_set_header Content-Length "";
            proxy_set_header X-Original-URI $request_uri;
            proxy_set_header X-Original-Method $request_method;
            proxy_set_header Authorization $http_authorization;
            
            proxy_connect_timeout 5s;
            proxy_send_timeout 5s;
            proxy_read_timeout 5s;
        }

        # Debug endpoint for JWT validator
        location /jwt {
            proxy_pass http://jwt_validator;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            add_header 'Access-Control-Allow-Origin' '*';
        }

        # Error pages with CORS headers
        error_page 401 = @error401;
        error_page 403 = @error403;
        error_page 500 502 503 504 = @error50x;

        location @error401 {
            internal;
            add_header 'Content-Type' 'application/json';
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
            return 401 '{"error":"Authentication required","code":"AUTHENTICATION_REQUIRED"}';
        }

        location @error403 {
            internal;
            add_header 'Content-Type' 'application/json';
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
            return 403 '{"error":"Access forbidden","code":"ACCESS_FORBIDDEN"}';
        }

        location @error50x {
            internal;
            add_header 'Content-Type' 'application/json';
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
            return 500 '{"error":"Internal server error","code":"INTERNAL_ERROR"}';
        }
    }
}
EOF

echo "✅ Updated nginx config with proxy_hide_header directives"

# Step 5: Restart nginx
echo ""
echo "🔄 Restarting nginx with updated configuration..."

# Stop nginx
if pgrep nginx > /dev/null; then
    sudo nginx -s quit 2>/dev/null || sudo nginx -s stop 2>/dev/null || true
    sleep 2
fi

# Force kill if still running
if pgrep nginx > /dev/null; then
    sudo pkill -9 nginx
    sleep 2
fi

# Test config
if nginx -t -c "$(pwd)/nginx/nginx.conf" 2>/dev/null; then
    echo "✅ nginx configuration is valid"
else
    echo "❌ nginx configuration has errors:"
    nginx -t -c "$(pwd)/nginx/nginx.conf"
    exit 1
fi

# Start nginx
sudo nginx -c "$(pwd)/nginx/nginx.conf"

if [ $? -eq 0 ]; then
    echo "✅ nginx restarted successfully"
    sleep 3
else
    echo "❌ Failed to restart nginx"
    exit 1
fi

# Step 6: Test the fix
echo ""
echo "🧪 Testing CORS Fix"
echo "==================="

# Test direct LanguageTool (should have no CORS headers now)
echo "📋 Testing LanguageTool directly (port 8081):"
DIRECT_TEST=$(curl -s -I -X POST -H "Origin: http://localhost:3080" -H "Content-Type: application/x-www-form-urlencoded" http://localhost:8081/v2/check 2>/dev/null)

DIRECT_CORS=$(echo "$DIRECT_TEST" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')
echo "   CORS headers from LanguageTool: $DIRECT_CORS"

if [ "$DIRECT_CORS" = "0" ]; then
    echo "   ✅ Good! LanguageTool no longer adds CORS headers"
else
    echo "   ⚠️  LanguageTool still adding CORS headers"
fi

# Test nginx proxy
echo ""
echo "📋 Testing nginx proxy (port 8010):"
PROXY_TEST=$(curl -s -I -X POST -H "Origin: http://localhost:3080" -H "Authorization: Bearer test" -H "Content-Type: application/x-www-form-urlencoded" http://localhost:8010/v2/check 2>/dev/null)

PROXY_CORS=$(echo "$PROXY_TEST" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')
echo "   CORS headers from nginx: $PROXY_CORS"

if [ "$PROXY_CORS" = "1" ]; then
    echo "   ✅ Perfect! nginx adds exactly 1 CORS header"
    echo "   $(echo "$PROXY_TEST" | grep -i "access-control-allow-origin")"
else
    echo "   ❌ nginx adding $PROXY_CORS CORS headers (expected 1)"
fi

# Final result
echo ""
echo "📊 Final Result:"
echo "================"
echo "LanguageTool CORS headers: $DIRECT_CORS (should be 0)"
echo "nginx CORS headers: $PROXY_CORS (should be 1)"

if [ "$DIRECT_CORS" = "0" ] && [ "$PROXY_CORS" = "1" ]; then
    echo ""
    echo "🎉 SUCCESS! CORS duplication fixed!"
    echo ""
    echo "💡 What was changed:"
    echo "   • LanguageTool started WITHOUT --allow-origin parameter"
    echo "   • nginx uses proxy_hide_header to remove any upstream CORS"
    echo "   • nginx adds its own single CORS headers"
    echo ""
    echo "🧪 Test your frontend now - CORS errors should be gone!"
    echo "🌐 API endpoint: http://localhost:8010/v2/check"
    
else
    echo ""
    echo "⚠️  Still have CORS issues. Check the test results above."
    echo ""
    echo "🔧 Additional debugging:"
    echo "   • Clear browser cache completely"
    echo "   • Check browser Network tab for actual headers"
    echo "   • View nginx error log: tail -f /tmp/nginx_languagetool_error.log"
fi

echo ""
echo "📝 Files changed:"
echo "   LanguageTool log: logs/languagetool-no-cors.log"
echo "   nginx backup: nginx/nginx.conf.pre-cors-fix"
echo "   Current nginx: nginx/nginx.conf"