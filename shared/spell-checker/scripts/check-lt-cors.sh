#!/bin/bash

# Check if LanguageTool itself is adding CORS headers

echo "🔍 Checking LanguageTool CORS Headers"
echo "====================================="
echo ""

echo "This will help determine if the duplicate CORS headers are coming from:"
echo "1. nginx configuration (our proxy)"
echo "2. LanguageTool server itself"
echo ""

# Test direct LanguageTool access (bypassing nginx)
echo "📋 Testing LanguageTool directly (port 8081, no nginx):"
echo "======================================================"

if curl -s -f -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "text=test&language=en-US" http://localhost:8081/v2/check > /dev/null; then
    echo "✅ LanguageTool is responding on port 8081"
    
    # Check CORS headers from direct LanguageTool access
    echo ""
    echo "🔍 CORS headers from LanguageTool directly:"
    
    DIRECT_RESPONSE=$(curl -s -I -X POST \
        -H "Origin: http://localhost:3080" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        http://localhost:8081/v2/check 2>/dev/null)
    
    echo "---"
    echo "$DIRECT_RESPONSE" | grep -i "access-control" || echo "No CORS headers from LanguageTool"
    echo "---"
    
    DIRECT_CORS_COUNT=$(echo "$DIRECT_RESPONSE" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')
    
    if [ "$DIRECT_CORS_COUNT" -gt 0 ]; then
        echo "⚠️  LanguageTool is adding $DIRECT_CORS_COUNT CORS header(s)"
        echo "💡 This could be the source of duplicates when combined with nginx"
    else
        echo "✅ LanguageTool is not adding CORS headers (good)"
    fi
    
else
    echo "❌ LanguageTool is not responding on port 8081"
    echo "💡 Start LanguageTool first to test"
fi

echo ""

# Test nginx proxy access
echo "📋 Testing nginx proxy (port 8010):"
echo "==================================="

if curl -s -f http://localhost:8010/health > /dev/null; then
    echo "✅ nginx proxy is responding on port 8010"
    
    echo ""
    echo "🔍 CORS headers from nginx proxy:"
    
    PROXY_RESPONSE=$(curl -s -I -X OPTIONS \
        -H "Origin: http://localhost:3080" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Authorization, Content-Type" \
        http://localhost:8010/v2/check 2>/dev/null)
    
    echo "---"
    echo "$PROXY_RESPONSE" | grep -i "access-control" || echo "No CORS headers from nginx"
    echo "---"
    
    PROXY_CORS_COUNT=$(echo "$PROXY_RESPONSE" | grep -i "access-control-allow-origin" | wc -l | tr -d ' ')
    
    if [ "$PROXY_CORS_COUNT" -gt 1 ]; then
        echo "❌ nginx is adding $PROXY_CORS_COUNT CORS headers (should be 1)"
    elif [ "$PROXY_CORS_COUNT" = 1 ]; then
        echo "✅ nginx is adding exactly 1 CORS header (correct)"
    else
        echo "⚠️  nginx is not adding CORS headers"
    fi
    
else
    echo "❌ nginx proxy is not responding on port 8010"
    echo "💡 Start nginx first: sudo nginx -c $(pwd)/nginx/nginx.conf"
fi

echo ""

# Compare both
echo "📊 Comparison:"
echo "=============="
echo "Direct LanguageTool (8081): $DIRECT_CORS_COUNT CORS headers"
echo "nginx Proxy (8010): $PROXY_CORS_COUNT CORS headers"

if [ "$DIRECT_CORS_COUNT" -gt 0 ] && [ "$PROXY_CORS_COUNT" -gt 0 ]; then
    echo ""
    echo "❌ PROBLEM IDENTIFIED:"
    echo "   Both LanguageTool AND nginx are adding CORS headers"
    echo "   This causes duplication: LanguageTool adds headers, then nginx adds more"
    echo ""
    echo "🔧 SOLUTION:"
    echo "   Option 1: Configure nginx to NOT add CORS headers (let LanguageTool handle it)"
    echo "   Option 2: Configure LanguageTool to NOT add CORS headers (let nginx handle it)"
    echo "   Option 3: Use nginx proxy_hide_header to remove LanguageTool's CORS headers"
    echo ""
    echo "💡 Recommended: Let nginx handle CORS (Option 2)"
    
elif [ "$DIRECT_CORS_COUNT" -gt 1 ]; then
    echo ""
    echo "❌ PROBLEM: LanguageTool itself is adding multiple CORS headers"
    echo "💡 Check LanguageTool configuration or startup parameters"
    
elif [ "$PROXY_CORS_COUNT" -gt 1 ]; then
    echo ""
    echo "❌ PROBLEM: nginx configuration is adding multiple CORS headers"
    echo "💡 Check nginx.conf for duplicate add_header directives"
    
else
    echo ""
    echo "✅ CORS headers look correct individually"
    echo "💡 The issue might be in how they combine or browser caching"
fi

echo ""
echo "🔧 Next Steps:"
echo "=============="

if [ "$DIRECT_CORS_COUNT" -gt 0 ]; then
    echo "1. Disable CORS in LanguageTool (recommended)"
    echo "   • Remove --allow-origin parameter when starting LanguageTool"
    echo "   • Let nginx handle all CORS"
fi

echo "2. Clear browser cache completely"
echo "3. Test with curl to verify headers"
echo "4. Test with browser developer tools"

echo ""
echo "📝 Test commands:"
echo "   Direct LT: curl -I http://localhost:8081/v2/check"
echo "   Via nginx: curl -I http://localhost:8010/v2/check"