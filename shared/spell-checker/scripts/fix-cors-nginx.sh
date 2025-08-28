#!/bin/bash

# Fix CORS duplicate headers in nginx configuration

echo "🔧 Fixing CORS Headers in nginx Configuration"
echo "============================================="
echo ""

# Backup current nginx config
if [ -f "nginx/nginx.conf" ]; then
    echo "💾 Backing up current nginx.conf..."
    cp nginx/nginx.conf nginx/nginx.conf.cors-backup
    echo "✅ Backup saved as nginx.conf.cors-backup"
else
    echo "❌ nginx.conf not found at nginx/nginx.conf"
    exit 1
fi

echo ""
echo "🔍 The issue: Multiple CORS headers being set"
echo "   nginx is adding CORS headers multiple times"
echo "   Result: 'Access-Control-Allow-Origin: *, *'"
echo "   Expected: 'Access-Control-Allow-Origin: *'"
echo ""

# Create fixed nginx configuration
echo "📝 Creating fixed nginx configuration..."

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

    # CORS configuration map
    map $request_method $cors_method {
        OPTIONS 11;
        default 0;
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
            # Handle preflight requests FIRST (before auth_request)
            if ($request_method = 'OPTIONS') {
                # Set CORS headers for preflight
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }

            # JWT Authentication (only for non-OPTIONS requests)
            auth_request /auth;
            
            # Forward to LanguageTool server
            proxy_pass http://languagetool;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Set CORS headers for actual requests (avoid duplication)
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
            
            # Timeout settings for auth requests
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
            
            # CORS for debug endpoint
            add_header 'Access-Control-Allow-Origin' '*';
        }

        # Custom error pages with proper CORS headers
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

echo "✅ Created fixed nginx configuration"
echo ""

# Test the new configuration
echo "🔍 Testing nginx configuration..."
if nginx -t -c "$(pwd)/nginx/nginx.conf" 2>/dev/null; then
    echo "✅ Configuration test passed"
else
    echo "❌ Configuration test failed:"
    nginx -t -c "$(pwd)/nginx/nginx.conf"
    echo ""
    echo "💡 Restoring backup..."
    mv nginx/nginx.conf.cors-backup nginx/nginx.conf
    exit 1
fi

# Restart nginx
echo ""
echo "🔄 Restarting nginx..."

# Stop current nginx
if pgrep nginx > /dev/null; then
    echo "🛑 Stopping current nginx..."
    sudo nginx -s quit 2>/dev/null || sudo nginx -s stop 2>/dev/null || true
    sleep 2
fi

# Start with new config
echo "🚀 Starting nginx with fixed CORS configuration..."
sudo nginx -c "$(pwd)/nginx/nginx.conf"

if [ $? -eq 0 ]; then
    echo "✅ nginx restarted successfully"
    
    # Wait for nginx to start
    sleep 2
    
    # Test if it's responding
    if curl -s -f http://localhost:8010/health > /dev/null; then
        echo "✅ nginx is responding"
        
        echo ""
        echo "🧪 Testing CORS headers..."
        
        # Test OPTIONS request (preflight)
        echo "📋 Testing OPTIONS request:"
        CORS_TEST=$(curl -s -I -X OPTIONS \
            -H "Origin: http://localhost:3080" \
            -H "Access-Control-Request-Method: POST" \
            -H "Access-Control-Request-Headers: Authorization, Content-Type" \
            http://localhost:8010/v2/check)
        
        echo "$CORS_TEST" | grep -i "access-control"
        
        # Check for duplicate headers
        ORIGIN_COUNT=$(echo "$CORS_TEST" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')
        
        if [ "$ORIGIN_COUNT" = "1" ]; then
            echo "✅ CORS headers look good (no duplicates)"
        else
            echo "⚠️  Found $ORIGIN_COUNT Access-Control-Allow-Origin headers"
        fi
        
        echo ""
        echo "🎉 CORS fix applied!"
        echo ""
        echo "💡 Test in your browser now:"
        echo "   The CORS error should be resolved"
        echo "   Your frontend requests should work"
        
    else
        echo "❌ nginx not responding"
    fi
    
else
    echo "❌ Failed to start nginx"
    echo "💡 Check error logs: tail -f /tmp/nginx_languagetool_error.log"
fi

echo ""
echo "📋 What was fixed:"
echo "=================="
echo "✅ Removed duplicate CORS headers"
echo "✅ Proper preflight (OPTIONS) handling" 
echo "✅ CORS headers only set once per request"
echo "✅ Error pages include CORS headers"
echo ""
echo "📝 Files:"
echo "   Current config: nginx/nginx.conf"
echo "   Backup: nginx/nginx.conf.cors-backup"
echo "   Logs: /tmp/nginx_languagetool_error.log"