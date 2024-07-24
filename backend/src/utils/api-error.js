class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
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

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    const apiResponse = err.toApiResponse();
    return res.status(apiResponse.statusCode).json(apiResponse);
  }

  // Handle other types of errors (e.g., 500 Internal Server Error)
  return res.status(500).json({
    statusCode: 500,
    message: "Internal Server Error",
    success: false,
    errors: [err.message],
  });
};
