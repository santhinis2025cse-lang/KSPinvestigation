import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints.
 * Prevents brute-force login attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
});

/**
 * General API rate limiter for search, chat, and data-heavy endpoints.
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Please slow down your requests.',
    retryAfter: '1 minute'
  },
});

/**
 * AI copilot / chat rate limiter.
 */
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI service rate limit reached. Please wait a moment before sending another query.',
    retryAfter: '1 minute'
  },
});

/**
 * Report generation limiter — PDF generation is compute-intensive.
 */
export const reportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Report generation limit reached. Please wait before generating another report.',
    retryAfter: '5 minutes'
  },
});

