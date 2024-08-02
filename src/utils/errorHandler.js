import ApiError from "./api-error.js";

// errorHandler.js
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toApiResponse());
  }

  const apiError = new ApiError(500, "Internal Server Error", err.message);
  return res.status(500).json(apiError.toApiResponse());
};
