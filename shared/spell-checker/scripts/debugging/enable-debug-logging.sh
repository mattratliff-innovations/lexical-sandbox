#!/bin/bash

# Enable debug logging in JWT validator to see exactly what's failing

echo "🔍 Enabling Debug Logging for JWT Validator"
echo "============================================"
echo ""

# Backup current server.js
if [ -f "jwt-validator/server.js" ]; then
    echo "💾 Backing up current server.js..."
    cp jwt-validator/server.js jwt-validator/server.js.pre-debug
    echo "✅ Backup saved"
fi

echo "📝 Adding debug logging to JWT validator..."

# Add debug logging to the validation endpoint
cat > jwt-validator/debug-patch.js << 'EOF'
// Debug patch for JWT validator - adds extensive logging

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Enhanced logging with timestamps
console.log = (...args) => {
    const timestamp = new Date().toISOString();
    originalConsoleLog(`[${timestamp}] DEBUG:`, ...args);
};

console.error = (...args) => {
    const timestamp = new Date().toISOString(); 
    originalConsoleError(`[${timestamp}] ERROR:`, ...args);
};

// Add debug function
global.debugLog = (section, data) => {
    console.log(`🔍 [${section}]`, JSON.stringify(data, null, 2));
};
EOF

# Update server.js to include debug logging
sed -i.bak '/require.*dotenv.*config/a\
require("./debug-patch");' jwt-validator/server.js

# Add debug logging to the main validation endpoint
cat > jwt-validator/temp-validation.js << 'EOF'
// Enhanced validation endpoint with debug logging
app.get('/validate-token', async (req, res) => {
    console.log('🚀 Starting token validation...');
    
    try {
        const authHeader = req.headers.authorization;
        
        console.log('🔍 Checking authorization header...');
        debugLog('AUTH_HEADER', {
            present: !!authHeader,
            startsWithBearer: authHeader?.startsWith('Bearer '),
            length: authHeader?.length || 0
        });
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Missing or invalid authorization header');
            return res.status(401).json({ 
                error: 'Missing or invalid authorization header',
                code: 'MISSING_AUTH_HEADER'
            });
        }

        const token = authHeader.substring(7);
        console.log('🎫 Token extracted, length:', token.length);
        
        // Decode header to get key ID (kid) if available
        console.log('🔍 Decoding token header...');
        const decodedHeader = jwt.decode(token, { complete: true });
        
        if (!decodedHeader) {
            console.log('❌ Could not decode token header');
            return res.status(401).json({
                error: 'Invalid token format',
                code: 'INVALID_TOKEN'
            });
        }
        
        debugLog('TOKEN_HEADER', decodedHeader.header);
        
        const kid = decodedHeader.header.kid;
        const tokenAlg = decodedHeader.header.alg;
        
        console.log(`🔧 Token algorithm: ${tokenAlg}`);
        console.log(`🆔 Token key ID: ${kid || 'none'}`);
        
        if (tokenAlg !== 'RS256') {
            console.log(`❌ Algorithm mismatch! Expected RS256, got: ${tokenAlg}`);
            return res.status(401).json({
                error: `Unsupported algorithm: ${tokenAlg}. Expected RS256.`,
                code: 'ALGORITHM_MISMATCH'
            });
        }
        
        // Get the appropriate public key
        console.log('🔑 Getting public key...');
        let publicKey;
        try {
            publicKey = await getPublicKey(kid);
            console.log('✅ Public key retrieved successfully');
            console.log('🔑 Key preview:', publicKey.substring(0, 100) + '...');
        } catch (keyError) {
            console.error('❌ Error getting public key:', keyError);
            debugLog('KEY_ERROR', {
                message: keyError.message,
                kid: kid,
                keySource: KEY_SOURCE
            });
            return res.status(401).json({
                error: 'Could not retrieve public key for token verification',
                code: 'KEY_RETRIEVAL_ERROR',
                details: keyError.message
            });
        }
        
        // Configure verification options
        const verifyOptions = {
            algorithms: ['RS256']
        };
        
        console.log('🔍 Verify options:', verifyOptions);
        
        // Add issuer/audience checks if configured
        if (process.env.JWT_ISSUER) {
            verifyOptions.issuer = process.env.JWT_ISSUER;
            console.log('🏢 JWT Issuer check enabled:', process.env.JWT_ISSUER);
        }
        if (process.env.JWT_AUDIENCE) {
            verifyOptions.audience = process.env.JWT_AUDIENCE;
            console.log('👥 JWT Audience check enabled:', process.env.JWT_AUDIENCE);
        }
        
        // Verify the JWT token with RSA public key
        console.log('🔐 Verifying JWT signature...');
        let decoded;
        try {
            decoded = jwt.verify(token, publicKey, verifyOptions);
            console.log('✅ JWT signature verified successfully!');
        } catch (verifyError) {
            console.error('❌ JWT verification failed:', verifyError.message);
            debugLog('VERIFY_ERROR', {
                name: verifyError.name,
                message: verifyError.message,
                kid: kid,
                algorithm: tokenAlg
            });
            throw verifyError; // Re-throw to be handled by outer catch
        }
        
        debugLog('DECODED_TOKEN', {
            userId: decoded.userId || decoded.sub,
            permissions: decoded.permissions,
            roles: decoded.roles,
            userAttributes: decoded.user_attributes,
            exp: decoded.exp,
            iat: decoded.iat
        });
        
        // Log successful validation (without sensitive data)
        console.log(`✅ RS256 token validated for user: ${decoded.userId || decoded.sub || 'unknown'}`);
        
        // Check permissions with debug logging
        console.log('🔍 Checking permissions...');
        
        let hasPermission = false;
        let permissionSource = 'none';
        
        if (decoded.permissions && Array.isArray(decoded.permissions)) {
            console.log('📋 Found permissions array:', decoded.permissions);
            hasPermission = decoded.permissions.includes('spellcheck') || 
                          decoded.permissions.includes('scribe.administrator') ||
                          decoded.permissions.includes('scribe.immigration_services_officer');
            if (hasPermission) permissionSource = 'permissions';
        } 
        
        if (!hasPermission && decoded.roles) {
            console.log('👥 Checking roles:', decoded.roles);
            const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [];
            hasPermission = userRoles.includes('scribe.administrator') ||
                          userRoles.includes('scribe.immigration_services_officer') ||
                          userRoles.some(role => role.includes('administrator') || role.includes('spellcheck'));
            if (hasPermission) permissionSource = 'roles';
        }
        
        if (!hasPermission && decoded.user_attributes) {
            console.log('📝 Checking user_attributes:', decoded.user_attributes);
            const attrs = decoded.user_attributes;
            if (attrs['ICAM-App-Access-Role-Scribe']) {
                const icamRoles = attrs['ICAM-App-Access-Role-Scribe'];
                console.log('🏛️  ICAM roles found:', icamRoles);
                hasPermission = Array.isArray(icamRoles) && (
                    icamRoles.includes('scribe.administrator') ||
                    icamRoles.includes('scribe.immigration_services_officer')
                );
                if (hasPermission) permissionSource = 'user_attributes';
            }
        }
        
        console.log(`🔐 Permission check result: ${hasPermission} (source: ${permissionSource})`);
        
        if (!hasPermission && NODE_ENV !== 'development') {
            console.log(`❌ User ${decoded.userId || decoded.sub} lacks spellcheck permissions`);
            return res.status(403).json({ 
                error: 'Insufficient permissions for spellcheck service',
                code: 'INSUFFICIENT_PERMISSIONS',
                debug: {
                    userId: decoded.userId || decoded.sub,
                    permissions: decoded.permissions,
                    roles: decoded.roles,
                    userAttributes: decoded.user_attributes
                }
            });
        }

        // Check token expiration with buffer
        const now = Math.floor(Date.now() / 1000);
        const expirationBuffer = 60;
        
        console.log(`⏰ Token expiration check: exp=${decoded.exp}, now=${now}, buffer=${expirationBuffer}`);
        
        if (decoded.exp && decoded.exp < (now + expirationBuffer)) {
            const timeLeft = decoded.exp - now;
            console.log(`⚠️  Token expires in ${timeLeft} seconds (within ${expirationBuffer}s buffer)`);
            return res.status(401).json({ 
                error: 'Token is expired or near expiration',
                code: 'TOKEN_EXPIRED',
                debug: {
                    exp: decoded.exp,
                    now: now,
                    timeLeft: timeLeft
                }
            });
        }

        // Token is valid - return success
        console.log('🎉 Token validation successful!');
        
        const response = { 
            valid: true, 
            userId: decoded.userId || decoded.sub,
            permissions: decoded.permissions || decoded.roles || [],
            algorithm: 'RS256',
            permissionSource: permissionSource
        };
        
        debugLog('SUCCESS_RESPONSE', response);
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ RS256 token validation error:', {
            error: error.message,
            name: error.name,
            timestamp: new Date().toISOString()
        });
        
        // Return specific error codes based on JWT error types
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token signature or format',
                code: 'INVALID_TOKEN'
            });
        } else if (error.name === 'NotBeforeError') {
            return res.status(401).json({ 
                error: 'Token not yet valid',
                code: 'TOKEN_NOT_ACTIVE'
            });
        } else {
            return res.status(401).json({ 
                error: 'Token validation failed',
                code: 'VALIDATION_FAILED',
                debug: error.message
            });
        }
    }
});
EOF

# Replace the validation endpoint in server.js
echo "🔄 Patching server.js with debug version..."

# Create a temp file with the new endpoint
awk '
/app\.get.*validate-token/ {
    # Skip until the end of the current endpoint
    skip = 1
    brace_count = 0
    next
}
skip {
    if (/\{/) brace_count++
    if (/\}/) brace_count--
    if (brace_count == 0 && /^\}\);/) {
        skip = 0
        # Insert our debug version here
        system("cat jwt-validator/temp-validation.js")
        next
    }
    next
}
{print}
' jwt-validator/server.js > jwt-validator/server-debug.js

mv jwt-validator/server-debug.js jwt-validator/server.js

# Clean up temp files
rm -f jwt-validator/temp-validation.js

echo "✅ Debug logging enabled!"

# Restart the service
echo ""
echo "🔄 Restarting JWT validator with debug logging..."

JWT_PID=$(pgrep -f "node.*server.js" | head -n 1)
if [ ! -z "$JWT_PID" ]; then
    echo "🛑 Stopping existing JWT validator..."
    kill $JWT_PID
    sleep 2
fi

cd jwt-validator
nohup npm start > ../logs/jwt-validator-debug.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > ../logs/jwt-validator.pid
cd ..

echo "✅ JWT validator restarted with PID: $NEW_PID"
echo ""
echo "📋 Debug logging is now active!"
echo ""
echo "🧪 Test your token now:"
echo "   curl -X POST http://localhost:8010/v2/check \\"
echo "     -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "     -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "     -d \"text=test&language=en-US\""
echo ""
echo "📝 Watch debug logs:"
echo "   tail -f logs/jwt-validator-debug.log"
echo ""
echo "💡 The logs will show exactly where the validation is failing!"