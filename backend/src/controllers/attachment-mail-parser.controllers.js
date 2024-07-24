import {
  checkStatusOfTicket,
  connectToMailbox,
  fetchLastEmail,
} from "../utils/attachment-mail.utils.js";
import { asyncHandler } from "./../utils/async-handler.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";

export const attachmentMailParser = asyncHandler(async (req, res) => {
  let lock;
  try {
    const client = await connectToMailbox();
    lock = await client.getMailboxLock("INBOX"); // Acquire the mailbox lock

    const { emailBody, subject, date, from, success, message, ticketIds } =
      await fetchLastEmail(client);

    if (!success) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { message },
            "Either there is no message or has been deleted"
          )
        );
    }

    if (!ticketIds.length) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { message: "Please provide a hpsm ticket id" },
            "No ticket id found"
          )
        );
    }

    for (let ticketId of ticketIds) {
      const { message, success } = await checkStatusOfTicket(
        ticketId,
        emailBody
      );

      //FIXME: send EMail to user if ticket is resolved, closed or invalid ticket id
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { emailBody, subject, date, from, ticketIds },
          "Data fetched successfully"
        )
      );
  } catch (error) {
    console.log("Error:", error);
    // Handle network errors, server errors, and unexpected errors
    const status = err instanceof ApiError ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";

    throw new ApiError(status, message, err.message);
  } finally {
    if (lock) {
      await lock.release(); // Release the mailbox lock
    }
    // log out and close connection
    await client.logout();
  }
});
