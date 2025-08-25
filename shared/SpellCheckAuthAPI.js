// Backend API endpoint for spell checking with JWT authentication
// This can be implemented in Express.js, Next.js API routes, or your preferred backend framework

// Express.js implementation
const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // or axios
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'http://localhost:8010/v2/check';

// Rate limiting for spell check requests
const spellCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  message: 'Too many spell check requests, please try again later.',
  keyGenerator: (req) => {
    // Rate limit by user ID from JWT
    return req.user?.userId || req.ip;
  }
});

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Check if token is expired (additional safety check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      });
    }
  }
};

// Optional: Check user permissions for spell check feature
const checkSpellCheckPermission = (req, res, next) => {
  // Check if user has permission to use spell check
  const userPermissions = req.user.permissions || [];
  
  if (!userPermissions.includes('spellcheck') && !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Insufficient permissions for spell check feature.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  next();
};

// Spell check endpoint
router.post('/spellcheck', 
  spellCheckLimiter,
  authenticateJWT, 
  checkSpellCheckPermission, // Optional - remove if not needed
  async (req, res) => {
    try {
      const { text, language = 'en-US', enabledOnly = false } = req.body;

      // Validate input
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          error: 'Text is required and must be a string.',
          code: 'INVALID_INPUT'
        });
      }

      // Limit text length to prevent abuse
      if (text.length > 50000) {
        return res.status(400).json({
          error: 'Text too long. Maximum 50,000 characters allowed.',
          code: 'TEXT_TOO_LONG'
        });
      }

      // Log the request for monitoring
      console.log(`Spell check request from user ${req.user.userId}: ${text.length} characters`);

      // Prepare request to LanguageTool
      const formData = new URLSearchParams({
        text: text,
        language: language,
        enabledOnly: enabledOnly.toString(),
      });

      // Make request to LanguageTool server
      const response = await fetch(LANGUAGETOOL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'YourApp-SpellChecker/1.0',
        },
        body: formData,
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        console.error(`LanguageTool error: ${response.status} ${response.statusText}`);
        return res.status(502).json({
          error: 'Spell check service temporarily unavailable.',
          code: 'SERVICE_UNAVAILABLE'
        });
      }

      const data = await response.json();

      // Optional: Transform or filter the response
      const filteredData = {
        matches: data.matches.map(match => ({
          offset: match.offset,
          length: match.length,
          message: match.message,
          replacements: match.replacements.slice(0, 5), // Limit suggestions
          rule: match.rule?.id,
          context: {
            text: match.context?.text,
            offset: match.context?.offset,
            length: match.context?.length
          }
        }))
      };

      res.json(filteredData);

    } catch (error) {
      console.error('Spell check error:', error);
      
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        return res.status(504).json({
          error: 'Spell check request timed out.',
          code: 'TIMEOUT'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error during spell check.',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Token refresh endpoint (if you need it)
router.post('/auth/refresh', async (req, res) => {
  try {
    // Get refresh token from httpOnly cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token not provided.',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token (implement your own logic)
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Check if refresh token is in your database and still valid
    // const isValidRefreshToken = await checkRefreshTokenInDB(refreshToken);
    // if (!isValidRefreshToken) {
    //   return res.status(401).json({ error: 'Invalid refresh token' });
    // }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        userId: decoded.userId,
        username: decoded.username,
        permissions: decoded.permissions,
        // ... other claims
      },
      JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    res.json({
      token: newAccessToken,
      expiresIn: '15m'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token.',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Health check endpoint
router.get('/spellcheck/health', authenticateJWT, async (req, res) => {
  try {
    // Check if LanguageTool is accessible
    const response = await fetch(LANGUAGETOOL_URL.replace('/v2/check', '/v2/languages'), {
      method: 'GET',
      timeout: 5000
    });

    if (response.ok) {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'unhealthy', error: 'LanguageTool unreachable' });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

module.exports = router;

// Alternative Next.js API route implementation
// pages/api/spellcheck.js
/*
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // JWT Authentication
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { text, language = 'en-US', enabledOnly = false } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string.' });
    }

    if (text.length > 50000) {
      return res.status(400).json({ error: 'Text too long. Maximum 50,000 characters allowed.' });
    }

    const formData = new URLSearchParams({
      text: text,
      language: language,
      enabledOnly: enabledOnly.toString(),
    });

    const response = await fetch(process.env.LANGUAGETOOL_URL || 'http://localhost:8010/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Spell check service unavailable' });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.error('Spell check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
*/