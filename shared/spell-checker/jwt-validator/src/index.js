// JWT Validator Service - jwt-validator/src/index.js
// Latest version with comprehensive error handling and logging

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration from environment variables
const config = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtIssuer: process.env.JWT_ISSUER || 'your-application',
  jwtAudience: process.env.JWT_AUDIENCE || 'your-users',
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Validate configuration on startup
if (config.jwtSecret === 'your-secret-key-change-in-production' && config.nodeEnv === 'production') {
  console.warn('⚠️  WARNING: Using default JWT secret in production! Please set JWT_SECRET environment variable.');
}

// Log configuration on startup (without exposing secret)
console.log('🚀 JWT Validator Service Starting...');
console.log('📋 Configuration:');
console.log('   - Issuer:', config.jwtIssuer);
console.log('   - Audience:', config.jwtAudience);
console.log('   - Environment:', config.nodeEnv);
console.log('   - Port:', PORT);
console.log('   - JWT Secret:', config.jwtSecret ? '[SET]' : '[NOT SET]');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API service
}));

app.use(cors({
  origin: '*', // Configure this for production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware (only in development)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const logBody = { ...req.body };
      if (logBody.token) {
        logBody.token = '[REDACTED]';
      }
      console.log('   Body:', logBody);
    }
    next();
  });
}

// Response time middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - req.startTime;
    res.set('X-Response-Time', `${responseTime}ms`);
    originalSend.call(this, body);
  };
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jwt-validator',
    version: '1.0.0',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    config: {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      environment: config.nodeEnv,
      jwtSecretConfigured: !!config.jwtSecret
    }
  });
});

// Validate JWT token
app.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;

    // Input validation
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required',
        code: 'MISSING_TOKEN'
      });
    }

    if (typeof token !== 'string') {
      return res.status(400).json({
        valid: false,
        error: 'Token must be a string',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    if (!cleanToken) {
      return res.status(400).json({
        valid: false,
        error: 'Token cannot be empty',
        code: 'EMPTY_TOKEN'
      });
    }

    // Verify the token
    const decoded = jwt.verify(cleanToken, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      algorithms: ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'] // Common algorithms
    });

    // Log successful validation (only in development)
    if (config.nodeEnv === 'development') {
      console.log('✅ Token validated successfully for user:', decoded.sub || decoded.userId || 'unknown');
    }

    // Return validation result with sanitized data
    res.json({
      valid: true,
      decoded: {
        // Standard JWT claims
        sub: decoded.sub,
        iss: decoded.iss,
        aud: decoded.aud,
        exp: decoded.exp,
        iat: decoded.iat,
        nbf: decoded.nbf,
        jti: decoded.jti,
        
        // Common custom claims (only include if present)
        ...(decoded.userId && { userId: decoded.userId }),
        ...(decoded.username && { username: decoded.username }),
        ...(decoded.email && { email: decoded.email }),
        ...(decoded.permissions && { permissions: decoded.permissions }),
        ...(decoded.roles && { roles: decoded.roles }),
        ...(decoded.scope && { scope: decoded.scope })
      },
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      timeToExpiry: decoded.exp - Math.floor(Date.now() / 1000)
    });

  } catch (error) {
    console.error('❌ JWT validation error:', error.message);
    
    let errorMessage = 'Invalid token';
    let errorCode = 'INVALID_TOKEN';
    let statusCode = 401;

    // Handle specific JWT errors
    switch (error.name) {
      case 'TokenExpiredError':
        errorMessage = 'Token has expired';
        errorCode = 'TOKEN_EXPIRED';
        break;
      case 'JsonWebTokenError':
        errorMessage = 'Token is malformed or invalid';
        errorCode = 'MALFORMED_TOKEN';
        break;
      case 'NotBeforeError':
        errorMessage = 'Token is not yet valid';
        errorCode = 'TOKEN_NOT_YET_VALID';
        break;
      default:
        if (error.message.includes('jwt issuer invalid')) {
          errorMessage = 'Token issuer is invalid';
          errorCode = 'INVALID_ISSUER';
        } else if (error.message.includes('jwt audience invalid')) {
          errorMessage = 'Token audience is invalid';
          errorCode = 'INVALID_AUDIENCE';
        }
    }

    res.status(statusCode).json({
      valid: false,
      error: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      ...(config.nodeEnv === 'development' && { 
        debug: {
          originalError: error.message,
          errorType: error.name
        }
      })
    });
  }
});

// Decode token without validation (for debugging)
app.post('/decode', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
        code: 'MISSING_TOKEN'
      });
    }

    if (typeof token !== 'string') {
      return res.status(400).json({
        error: 'Token must be a string',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    // Decode without verification (for debugging purposes)
    const decoded = jwt.decode(cleanToken, { complete: true });

    if (!decoded) {
      return res.status(400).json({
        error: 'Invalid token format - unable to decode',
        code: 'DECODE_FAILED'
      });
    }

    // Check if token structure is valid
    if (!decoded.header || !decoded.payload) {
      return res.status(400).json({
        error: 'Token structure is invalid',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    res.json({
      header: decoded.header,
      payload: {
        ...decoded.payload,
        // Add human-readable timestamps
        ...(decoded.payload.exp && { 
          exp_readable: new Date(decoded.payload.exp * 1000).toISOString() 
        }),
        ...(decoded.payload.iat && { 
          iat_readable: new Date(decoded.payload.iat * 1000).toISOString() 
        }),
        ...(decoded.payload.nbf && { 
          nbf_readable: new Date(decoded.payload.nbf * 1000).toISOString() 
        })
      },
      signature: decoded.signature ? 'present' : 'missing',
      isExpired: decoded.payload.exp ? decoded.payload.exp < Math.floor(Date.now() / 1000) : null
    });

  } catch (error) {
    console.error('❌ JWT decode error:', error.message);
    res.status(400).json({
      error: 'Failed to decode token',
      code: 'DECODE_ERROR',
      message: error.message
    });
  }
});

// Get service info
app.get('/info', (req, res) => {
  res.json({
    service: 'jwt-validator',
    version: '1.0.0',
    description: 'JWT Token Validation Microservice',
    config: {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      environment: config.nodeEnv,
      jwtSecretConfigured: !!config.jwtSecret
    },
    endpoints: {
      health: {
        path: '/health',
        method: 'GET',
        description: 'Service health check'
      },
      validate: {
        path: '/validate',
        method: 'POST',
        description: 'Validate JWT token',
        body: { token: 'string (required)' }
      },
      decode: {
        path: '/decode',
        method: 'POST',
        description: 'Decode JWT token without validation',
        body: { token: 'string (required)' }
      },
      info: {
        path: '/info',
        method: 'GET',
        description: 'Service information'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint (simple)
app.get('/metrics', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.set('Content-Type', 'text/plain');
  res.send(`# JWT Validator Metrics
jwt_validator_uptime_seconds ${uptime}
jwt_validator_memory_heap_used_bytes ${memoryUsage.heapUsed}
jwt_validator_memory_heap_total_bytes ${memoryUsage.heapTotal}
jwt_validator_memory_external_bytes ${memoryUsage.external}
`);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  
  // Don't leak error details in production
  const errorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  if (config.nodeEnv === 'development') {
    errorResponse.debug = {
      message: error.message,
      stack: error.stack
    };
  }

  res.status(500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'POST /validate', 
      'POST /decode',
      'GET /info',
      'GET /metrics'
    ],
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Set up signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🟢 JWT Validator Service is running!`);
  console.log(`   📍 Port: ${PORT}`);
  console.log(`   🔗 Health: http://localhost:${PORT}/health`);
  console.log(`   📖 Info: http://localhost:${PORT}/info`);
  console.log(`   📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log('   ✨ Ready to validate JWT tokens!\n');
});