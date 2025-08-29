require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALGORITHM = 'RS256';
const KEY_SOURCE = process.env.KEY_SOURCE || 'file';
const JWKS_URL = process.env.JWKS_URL;
const PUBLIC_KEY_PATH = process.env.PUBLIC_KEY_PATH || path.join(__dirname, 'keys', 'public.pem');

console.log('🚀 Starting JWT Validator Service (RS256)');
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔧 Algorithm: ${ALGORITHM}`);
console.log(`🔑 Key Source: ${KEY_SOURCE}`);
console.log(`🌐 Port: ${PORT}`);

// Initialize JWKS client if using JWKS
let jwksClient;
if (KEY_SOURCE === 'jwks' && JWKS_URL) {
    const jwksClientLib = require('jwks-client');
    jwksClient = jwksClientLib({
        jwksUri: JWKS_URL,
        requestHeaders: {}, // Optional
        timeout: 30000, // Defaults to 30s
        jwksRequestsPerMinute: 5,
        jwksRequestOptions: {} // Used for HTTPS requests
    });
    console.log(`🔗 JWKS URL: ${JWKS_URL}`);
}

// Function to get the public key
async function getPublicKey(kid) {
    if (KEY_SOURCE === 'jwks' && jwksClient) {
        return new Promise((resolve, reject) => {
            jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    reject(err);
                } else {
                    const signingKey = key.publicKey || key.rsaPublicKey;
                    resolve(signingKey);
                }
            });
        });
    } else {
        // Load from file
        if (fs.existsSync(PUBLIC_KEY_PATH)) {
            return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
        } else {
            throw new Error(`Public key file not found: ${PUBLIC_KEY_PATH}`);
        }
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        algorithm: ALGORITHM,
        keySource: KEY_SOURCE,
        jwksUrl: JWKS_URL || 'N/A',
        publicKeyPath: KEY_SOURCE === 'file' ? PUBLIC_KEY_PATH : 'N/A',
        port: PORT
    });
});

// Main validation endpoint for nginx auth_request
app.get('/validate-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Missing or invalid authorization header');
            return res.status(401).json({ 
                error: 'Missing or invalid authorization header',
                code: 'MISSING_AUTH_HEADER'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Decode header to get key ID (kid) if available
        const decodedHeader = jwt.decode(token, { complete: true });
        if (!decodedHeader) {
            console.log('❌ Could not decode token header');
            return res.status(401).json({
                error: 'Invalid token format',
                code: 'INVALID_TOKEN'
            });
        }
        
        const kid = decodedHeader.header.kid;
        console.log(`🔍 Verifying RS256 token${kid ? ` (kid: ${kid})` : ''}`);
        
        // Get the appropriate public key
        let publicKey;
        try {
            publicKey = await getPublicKey(kid);
        } catch (keyError) {
            console.error('❌ Error getting public key:', keyError.message);
            return res.status(401).json({
                error: 'Could not retrieve public key for token verification',
                code: 'KEY_RETRIEVAL_ERROR'
            });
        }
        
        // Configure verification options
        const verifyOptions = {
            algorithms: ['RS256']
        };
        
        // Add issuer/audience checks if configured
        if (process.env.JWT_ISSUER) {
            verifyOptions.issuer = process.env.JWT_ISSUER;
        }
        if (process.env.JWT_AUDIENCE) {
            verifyOptions.audience = process.env.JWT_AUDIENCE;
        }
        
        // Verify the JWT token with RSA public key
        const decoded = jwt.verify(token, publicKey, verifyOptions);
        
        // Log successful validation (without sensitive data)
        console.log(`✅ RS256 token validated for user: ${decoded.userId || decoded.sub || 'unknown'}`);
        
        // Check permissions
        if (decoded.permissions && Array.isArray(decoded.permissions)) {
            const hasSpellcheckPermission = decoded.permissions.includes('spellcheck') || 
                                          decoded.permissions.includes('scribe.administrator') ||
                                          decoded.permissions.includes('scribe.immigration_services_officer');
            
            if (!hasSpellcheckPermission) {
                console.log(`❌ User ${decoded.userId || decoded.sub} lacks spellcheck permission`);
                return res.status(403).json({ 
                    error: 'Insufficient permissions for spellcheck service',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }
        } else {
            // If no permissions array, check for roles or other permission structures
            const userRoles = decoded.roles || decoded['user_attributes'] || [];
            const hasRole = Array.isArray(userRoles) && (
                userRoles.includes('scribe.administrator') ||
                userRoles.includes('scribe.immigration_services_officer') ||
                userRoles.some(role => role.includes('administrator') || role.includes('spellcheck'))
            );
            
            if (!hasRole && NODE_ENV !== 'development') {
                console.log(`❌ User ${decoded.userId || decoded.sub} has no recognized roles for spellcheck`);
                return res.status(403).json({ 
                    error: 'No permissions found for spellcheck service',
                    code: 'NO_PERMISSIONS'
                });
            }
        }

        // Check token expiration with buffer
        const now = Math.floor(Date.now() / 1000);
        const expirationBuffer = 60; // 1 minute buffer
        
        if (decoded.exp && decoded.exp < (now + expirationBuffer)) {
            console.log('⚠️  Token is near expiration or expired');
            return res.status(401).json({ 
                error: 'Token is expired or near expiration',
                code: 'TOKEN_EXPIRED'
            });
        }

        // Token is valid - return success
        res.status(200).json({ 
            valid: true, 
            userId: decoded.userId || decoded.sub,
            permissions: decoded.permissions || decoded.roles || [],
            algorithm: 'RS256'
        });
        
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
                code: 'VALIDATION_FAILED'
            });
        }
    }
});

// Direct validation endpoint (for testing)
app.post('/validate', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                error: 'Token is required',
                code: 'MISSING_TOKEN'
            });
        }
        
        // Decode to get kid
        const decodedHeader = jwt.decode(token, { complete: true });
        const kid = decodedHeader?.header?.kid;
        
        const publicKey = await getPublicKey(kid);
        const verifyOptions = { algorithms: ['RS256'] };
        
        const decoded = jwt.verify(token, publicKey, verifyOptions);
        
        res.status(200).json({
            valid: true,
            decoded: {
                userId: decoded.userId || decoded.sub,
                permissions: decoded.permissions || decoded.roles || [],
                exp: decoded.exp,
                iat: decoded.iat,
                algorithm: 'RS256'
            }
        });
        
    } catch (error) {
        console.error('❌ Direct RS256 validation error:', error.message);
        res.status(401).json({ 
            valid: false,
            error: error.message,
            code: 'VALIDATION_FAILED'
        });
    }
});

// Test endpoint (development only) - Note: Can't generate RS256 tokens without private key
if (NODE_ENV === 'development') {
    app.get('/test-key', async (req, res) => {
        try {
            const publicKey = await getPublicKey();
            res.json({
                keySource: KEY_SOURCE,
                publicKeyPreview: publicKey.substring(0, 100) + '...',
                jwksUrl: JWKS_URL || 'N/A'
            });
        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ JWT validation service running on http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Using RS256 with ${KEY_SOURCE} key source`);
    if (NODE_ENV === 'development') {
        console.log(`🧪 Test key endpoint: http://localhost:${PORT}/test-key`);
    }
    console.log('📝 Ready to validate RS256 JWT tokens!');
});

module.exports = app;
