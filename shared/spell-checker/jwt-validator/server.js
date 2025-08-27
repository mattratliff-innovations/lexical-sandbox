require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting JWT Validator Service');
console.log(`📊 Environment: ${NODE_ENV}`);
console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 8)}...`);
console.log(`🌐 Port: ${PORT}`);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        port: PORT
    });
});

// Main validation endpoint for nginx auth_request
app.get('/validate-token', (req, res) => {
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
        
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Log successful validation (without sensitive data)
        console.log(`✅ Token validated for user: ${decoded.userId || decoded.sub || 'unknown'}`);
        
        // Optional: Check permissions
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
        }

        // Token is valid - return success
        res.status(200).json({ 
            valid: true, 
            userId: decoded.userId || decoded.sub,
            permissions: decoded.permissions || []
        });
        
    } catch (error) {
        console.error('❌ Token validation error:', error.message);
        
        // Return specific error codes
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token format',
                code: 'INVALID_TOKEN'
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
app.post('/validate', (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                error: 'Token is required',
                code: 'MISSING_TOKEN'
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        res.status(200).json({
            valid: true,
            decoded: {
                userId: decoded.userId || decoded.sub,
                permissions: decoded.permissions || [],
                exp: decoded.exp,
                iat: decoded.iat
            }
        });
        
    } catch (error) {
        console.error('❌ Direct validation error:', error.message);
        res.status(401).json({ 
            valid: false,
            error: error.message,
            code: 'VALIDATION_FAILED'
        });
    }
});

// Generate test token endpoint (development only)
if (NODE_ENV === 'development') {
    app.post('/generate-test-token', (req, res) => {
        try {
            const { userId = 'test-user', permissions = ['spellcheck'] } = req.body;
            
            const token = jwt.sign({
                userId: userId,
                permissions: permissions,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
            }, JWT_SECRET);
            
            res.json({
                token: token,
                bearer: `Bearer ${token}`,
                decoded: jwt.decode(token)
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
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
    if (NODE_ENV === 'development') {
        console.log(`🧪 Test token generator: http://localhost:${PORT}/generate-test-token`);
    }
    console.log('📝 Ready to validate JWT tokens!');
});

module.exports = app;