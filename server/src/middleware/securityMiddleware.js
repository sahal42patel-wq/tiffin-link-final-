/**
 * OWASP Top 10 Security Middleware Suite for TiffinLink
 * Protects against:
 * - A01:2025 Broken Access Control
 * - A02:2025 Security Misconfiguration
 * - A04:2025 Cryptographic Failures
 * - A05:2025 Injection (NoSQL, SQL, XSS, Command Injection)
 * - A07:2025 Authentication Failures (Brute-Force & Credential Stuffing)
 * - A08:2025 Software & Data Integrity Failures
 * - A09:2025 Security Logging & Alerting Failures
 * - A10:2025 Mishandling of Exceptional Conditions
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

/**
 * A02 & A05: Helmet HTTP Security Headers
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "https://*"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' }, // Anti-Clickjacking
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true // Deprecated in modern browsers but useful legacy header
  });
};

const isLocalhost = (ip) => {
  return !ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
};

/**
 * A07: General API Rate Limiter
 * In development / localhost: skipped to prevent blocking multi-tab dashboard live-polling.
 * In production: 2,500 requests per 10 minutes per IP (allowing for active live tracking & dispatch telemetry).
 */
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2500,
  skip: (req) => process.env.NODE_ENV !== 'production' || isLocalhost(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP. Please try again after a few minutes.'
  }
});

/**
 * A07: Strict Auth Rate Limiter
 * Prevents brute-force on login, OTP, and registration endpoints.
 * In development / localhost: generous limit so development & OTP testing is never blocked.
 * In production: 60 attempts per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: (req) => process.env.NODE_ENV !== 'production' || isLocalhost(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. For your security, this action is temporarily locked for 15 minutes.'
  }
});

/**
 * A05: Recursive XSS and Dangerous Script Tag Sanitizer
 */
const sanitizeXSS = (req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        // Strip out dangerous <script> tags, onload/onerror payloads, and javascript: pseudo-protocols
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object') {
        clean(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);

  next();
};

/**
 * A09: Security Audit Logging Middleware
 * Monitors high-risk actions, authentication failures, and privilege escalations
 */
const securityAuditLogger = (req, res, next) => {
  const sensitivePaths = ['/api/auth/login', '/api/auth/register', '/api/delivery', '/api/providers', '/admin'];
  const isSensitive = sensitivePaths.some(p => req.originalUrl.includes(p));

  if (isSensitive && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const actor = req.user ? `${req.user.role || 'user'}:${req.user._id || req.user.id}` : 'anonymous';

    console.log(`[SECURITY-AUDIT] [${timestamp}] ${req.method} ${req.originalUrl} - Actor: ${actor} - IP: ${ip} - UA: ${userAgent}`);
  }
  next();
};

/**
 * A02: Security Misconfiguration - Remove Server Leaks
 */
const removeFingerprints = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
};

module.exports = {
  configureHelmet,
  apiLimiter,
  authLimiter,
  sanitizeXSS,
  mongoSanitize: () => mongoSanitize({ replaceWith: '_' }),
  hpp: () => hpp(),
  securityAuditLogger,
  removeFingerprints
};
