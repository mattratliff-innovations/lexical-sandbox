#!/bin/bash

# Quick fix for RS256 validator configuration

echo "🔧 Quick RS256 Validator Fix"
echo "============================"
echo ""

# Check current validator status
echo "📊 Current Validator Status:"
if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3001/health)
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
    
    ALG=$(echo "$HEALTH" | jq -r '.algorithm // "not set"' 2>/dev/null)
    if [ "$ALG" = "not set" ] || [ "$ALG" = "unknown" ] || [ "$ALG" = "null" ]; then
        echo ""
        echo "❌ Algorithm not properly set in validator"
        echo "💡 Need to reconfigure for RS256"
    fi
else
    echo "❌ JWT Validator not responding"
fi

echo ""

# Check if we have RSA setup
if [ -d "jwt-validator/keys" ] || [ -f "jwt-validator/.env" ]; then
    echo "✅ Found existing RS256 configuration"
    
    # Check .env file
    if [ -f "jwt-validator/.env" ]; then
        echo "📋 Current .env contents:"
        cat jwt-validator/.env
    fi
    
    # Check for public key
    if [ -f "jwt-validator/keys/public.pem" ]; then
        echo "🔑 Public key file exists"
        echo "Key preview: $(head -1 jwt-validator/keys/public.pem)"
    else
        echo "❌ No public key file found"
    fi
    
else
    echo "❌ No RS256 configuration found"
    echo "💡 You need to run the RS256 setup first"
    echo ""
    read -p "Run RS256 setup now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./setup-rs256-jwt.sh
        exit 0
    else
        echo "❌ Cannot continue without RS256 setup"
        exit 1
    fi
fi

echo ""

# Kill current validator
echo "🛑 Restarting JWT Validator..."
JWT_PID=$(pgrep -f "node.*server.js" | head -n 1)
if [ ! -z "$JWT_PID" ]; then
    echo "Stopping current validator (PID: $JWT_PID)"
    kill $JWT_PID
    sleep 2
fi

# Ensure .env has correct algorithm
echo "📝 Ensuring .env has correct RS256 configuration..."

# Update or create .env with RS256 settings
cat > jwt-validator/.env << 'EOF'
# JWT Configuration for RS256
NODE_ENV=development
PORT=3001

# Algorithm (must be RS256)
JWT_ALGORITHM=RS256

# Key source: 'file' or 'jwks'
KEY_SOURCE=file

# Public key file path
PUBLIC_KEY_PATH=keys/public.pem

# Optional: JWT issuer and audience validation
# JWT_ISSUER=https://your-auth-server.com
# JWT_AUDIENCE=your-app-audience
EOF

echo "✅ Updated .env with RS256 configuration"

# Check if public key exists
if [ ! -f "jwt-validator/keys/public.pem" ]; then
    echo ""
    echo "❌ Missing RSA public key!"
    echo "You need to provide your RSA public key."
    echo ""
    echo "Options:"
    echo "1. Get the key from your backend team"
    echo "2. Find your JWKS URL"
    echo "3. Extract from your app's OIDC configuration"
    echo ""
    read -p "Do you have the RSA public key? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Please paste your RSA public key (should start with -----BEGIN):"
        echo "Press Enter on empty line when done:"
        
        mkdir -p jwt-validator/keys
        KEY_CONTENT=""
        while IFS= read -r line; do
            [ -z "$line" ] && break
            KEY_CONTENT="$KEY_CONTENT$line\n"
        done
        
        if [ ! -z "$KEY_CONTENT" ]; then
            echo -e "$KEY_CONTENT" > jwt-validator/keys/public.pem
            echo "✅ Public key saved"
        else
            echo "❌ No key provided"
            exit 1
        fi
    else
        echo ""
        echo "💡 You need the RSA public key to continue."
        echo "Contact your backend team or check your app's OIDC configuration."
        exit 1
    fi
fi

# Start validator
echo ""
echo "🚀 Starting RS256 JWT Validator..."

cd jwt-validator
nohup npm start > ../logs/jwt-validator-rs256-fixed.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > ../logs/jwt-validator.pid
cd ..

echo "✅ Validator started with PID: $NEW_PID"

# Wait for startup
echo "⏳ Waiting for validator to start..."
sleep 5

# Test the fix
echo ""
echo "🧪 Testing RS256 configuration..."

if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Validator is responding"
    
    HEALTH_CHECK=$(curl -s http://localhost:3001/health)
    NEW_ALG=$(echo "$HEALTH_CHECK" | jq -r '.algorithm // "unknown"' 2>/dev/null)
    
    echo "🔧 New Algorithm Setting: $NEW_ALG"
    
    if [ "$NEW_ALG" = "RS256" ]; then
        echo "✅ Algorithm correctly set to RS256!"
        
        # Test with expired token (should get different error)
        echo ""
        echo "🧪 Testing with your token (expecting 'expired' error now)..."
        
        if [ -f "token.txt" ]; then
            TEST_RESULT=$(curl -s -X POST http://localhost:3001/validate \
                -H "Content-Type: application/json" \
                -d "{\"token\":\"$(cat token.txt)\"}")
            
            echo "📊 Test Result: $TEST_RESULT"
            
            if echo "$TEST_RESULT" | grep -q "expired"; then
                echo ""
                echo "🎉 SUCCESS! RS256 is now working!"
                echo "❌ Your token is expired - get a fresh one from your app"
                echo ""
                echo "💡 Next steps:"
                echo "1. Get fresh token: localStorage.getItem('id_token')"  
                echo "2. Update token.txt: echo 'NEW_TOKEN' > token.txt"
                echo "3. Test again: ./debug-token.sh"
            else
                echo ""
                echo "⚠️  Different error - check the response above"
            fi
        else
            echo "📝 No token.txt found to test with"
        fi
        
    else
        echo "❌ Algorithm still not set correctly"
        echo "📋 Check logs: tail -f logs/jwt-validator-rs256-fixed.log"
    fi
    
else
    echo "❌ Validator failed to start"
    echo "📋 Check logs: tail -f logs/jwt-validator-rs256-fixed.log"
fi

echo ""
echo "📝 Important files:"
echo "   Config: jwt-validator/.env"
echo "   Public Key: jwt-validator/keys/public.pem" 
echo "   Logs: logs/jwt-validator-rs256-fixed.log"