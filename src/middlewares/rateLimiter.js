// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";
import ApiError from "../utils/api-error.js";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many requests, please try again later."));
  },
});
