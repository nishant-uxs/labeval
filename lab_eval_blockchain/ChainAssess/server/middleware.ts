import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import { createLogger } from './logger';

const log = createLogger('middleware');

// --------------- Helmet ---------------
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://*.alchemy.com',
        'https://*.infura.io',
        'https://api.pinata.cloud',
        'https://gateway.pinata.cloud',
        'wss://*.metamask.io',
        'https://*.metamask.io',
        'https://sepolia.etherscan.io',
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// --------------- CORS ---------------
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5000', 'http://localhost:3000']
).filter(Boolean);

export const corsPolicy = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // In production, allow any *.onrender.com subdomain (deployed frontend)
    if (process.env.NODE_ENV === 'production' && /^https:\/\/[^/]+\.onrender\.com$/.test(origin)) {
      return callback(null, true);
    }
    log.warn('CORS blocked request', { origin });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address'],
});

// --------------- Rate Limiting ---------------
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  validate: { xForwardedForHeader: false },
});

// Stricter limit for admin operations
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // 10 admin requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests, please try again later.' },
});

// Stricter limit for write operations (blockchain txs)
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later.' },
});

// --------------- Input Validation ---------------
export function validateEthAddress(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const address = req.params[paramName] || req.body?.[paramName];
    if (!address) {
      return res.status(400).json({ error: `${paramName} is required` });
    }
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: `Invalid Ethereum address for ${paramName}: ${address}` });
    }
    // Normalize to checksum address
    if (req.params[paramName]) {
      req.params[paramName] = ethers.getAddress(address);
    }
    if (req.body?.[paramName]) {
      req.body[paramName] = ethers.getAddress(address);
    }
    next();
  };
}

export function validateBatchId(req: Request, res: Response, next: NextFunction) {
  const { batchId } = req.params;
  if (!batchId || isNaN(Number(batchId)) || Number(batchId) < 1) {
    return res.status(400).json({ error: `Invalid batchId: ${batchId}` });
  }
  next();
}

export function validateAssignmentId(req: Request, res: Response, next: NextFunction) {
  const { assignmentId } = req.params;
  if (!assignmentId || isNaN(Number(assignmentId)) || Number(assignmentId) < 1) {
    return res.status(400).json({ error: `Invalid assignmentId: ${assignmentId}` });
  }
  next();
}

// --------------- Request Logger ---------------
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    log[level](`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      wallet: (req.headers['x-wallet-address'] as string) || undefined,
    });
  });
  next();
}
