import rateLimit from "express-rate-limit";

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) console.warn("NODE_ENV variable is not set")

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: NODE_ENV === "test" ? 100 : 5, // limit each IP to 5 requests per window (100 in tests)
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again later."
  }
});
