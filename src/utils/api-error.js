import logger from "./logger.js";

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = Number(statusCode);
    this.message = String(message);
    this.success = false;
    this.errors = Array.isArray(errors) ? errors : [errors];

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
    logger.error(`ApiError: ${this.message}`, {
      statusCode: this.statusCode,
      errors: this.errors,
    });
  }

  toApiResponse() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      success: this.success,
      errors: this.errors,
    };
  }
}

export default ApiError;
