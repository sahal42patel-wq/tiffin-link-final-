const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

// Security Middleware Suite (OWASP Top 10 2025 Standard)
const {
  configureHelmet,
  apiLimiter,
  authLimiter,
  sanitizeXSS,
  mongoSanitize,
  hpp,
  securityAuditLogger,
  removeFingerprints
} = require('./middleware/securityMiddleware');

// 1. HTTP Security Headers (A02: Security Misconfiguration)
app.use(configureHelmet());
app.use(removeFingerprints);

// 2. CORS configuration (A01: Broken Access Control)
app.use(cors({
  origin: true,
  credentials: true
}));

// 3. Body Parsing with safe limits (A05: Injection & DoS)
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// 4. NoSQL Query Injection Sanitization (A05: Injection)
// Strips dollar signs ($) and dots (.) from req.body, req.query, and req.params
app.use(mongoSanitize());

// 5. HTTP Parameter Pollution Protection (A08: Data Integrity)
app.use(hpp());

// 6. Cross-Site Scripting (XSS) Sanitization (A05: Injection)
app.use(sanitizeXSS);

// 7. Security Audit Logging (A09: Security Logging & Alerting Failures)
app.use(securityAuditLogger);

// 8. Rate Limiting (A07: Authentication & Resource Consumption Failures)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api', apiLimiter);

// 9. Session Security (A04: Cryptographic Failures & A07: Session Management)
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  name: '__tl_sid',
  secret: process.env.SESSION_SECRET || 'tiffinlink_session_super_secret_key_2026_secured',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents JavaScript client document.cookie access
    secure: isProduction, // Transmitted only via HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF mitigation
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// API Routes
const advancedFeaturesRoutes = require('./routes/advancedFeaturesRoutes');
app.use('/api/v1', advancedFeaturesRoutes);
app.use('/api', advancedFeaturesRoutes);
app.use('/api', routes);

// Root Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'TiffinLink MERN API Server',
    cookiesEnabled: true,
    sessionActive: !!req.session,
    timestamp: new Date().toISOString()
  });
});

// API 404 Handler for undefined routes (returns JSON, not HTML)
app.use('/api', notFoundHandler);
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

