import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import logger from "./utils/logger.js";
import helmet from "helmet";
import compression from "compression";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { startEmailListener } from "./utils/attachment-mail.utils.js";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

// Helmet helps secure Express apps by setting HTTP response headers.
app.use(helmet());

// Node.js compression middleware.
app.use(compression());

// allow json body
app.use(express.json({ limit: "16kb" }));

// allow params, query params
app.use(urlencoded({ extended: true, limit: "16kb" }));

// parse cookie
app.use(cookieParser());

// Use the rate limiter middleware
app.use(apiLimiter);

// / Routes
import emailRouter from "./routes/mail-parser.routes.js";
app.use("/api/v1/mail", emailRouter);

// Use the error handling middleware

app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.use((err, req, res, next) => {
  logger.error("Unhandled error:", { error: err.message, stack: err.stack });
  errorHandler(err, req, res, next);
});

// Start email listener
const initializeApp = async () => {
  try {
    logger.info("Email listener started successfully1");
    await startEmailListener();
    logger.info("Email listener started successfully2");
  } catch (error) {
    logger.error("Failed to start email listener:", error);
  }
};

initializeApp();

export default app;
