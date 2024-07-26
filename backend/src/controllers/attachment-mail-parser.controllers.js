import { asyncHandler } from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import { startEmailListener } from "../utils/attachment-mail.utils.js";
import logger from "../utils/logger.js";

export const attachmentMailParser = asyncHandler(async (req, res) => {
  logger.info("Attachment mail parser controller called");
  // This endpoint can be used to manually trigger the email listener if needed
  await startEmailListener();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email listener started successfully"));
});

export const healthCheck = asyncHandler(async (req, res) => {
  // You can add more sophisticated checks here if needed
  res
    .status(200)
    .json(new ApiResponse(200, { status: "healthy" }, "Service is healthy"));
});
