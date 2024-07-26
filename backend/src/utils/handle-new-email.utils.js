import { simpleParser } from "mailparser";
import { checkStatusAndUpdateJournal } from "./attachment-mail.utils.js";
import logger from "./logger.js";

export const handleNewEmail = async (client) => {
  let lock;
  try {
    lock = await client.getMailboxLock("INBOX");

    const message = await client.fetchOne("*", {
      // envelope: true,
      // flags: true,
      source: true,
    });

    if (!message) {
      logger.info("No new message found");
      return;
    }

    const emailBodyBuffer = Buffer.from(message.source);
    const {
      text: emailBody,
      subject,
      date,
      headers,
    } = await simpleParser(emailBodyBuffer);
    const from = headers.get("from").value[0].address;

    if (!emailBody) {
      logger.info("No new message found");
      return;
    }

    // Remove "Fw: " from the start of the subject if it exists
    const cleanedSubject = cleanSubjectText(subject);

    // Extract ticket IDs
    const ticketIds = extractTicketIds(subject);

    // Clean up the email Body
    let cleanedEmailBody = cleanEmailBody(emailBody); // Trim leading and trailing spaces

    if (!ticketIds.length) {
      console.log("No ticket ID found in the email");
      return;
    }

    for (let ticketId of ticketIds) {
      const { message, success } = await checkStatusAndUpdateJournal(
        ticketId,
        cleanedEmailBody
      );

      // success is true then delete this email from INBOX, last email
      if (success) {
        await client.messageDelete("*");
        continue;
      } else {
        // FIXME: ->> send email to the sender to inform that the email is not processed, provide correct ticket id
        // await client.messageDelete("*");
      }

      logger.info(
        `Ticket ${ticketId} update status: ${
          success ? "Success" : "Failed"
        }, Message: ${message}`
      );
    }

    logger.info("Email processed successfully", {
      subject,
      date,
      from,
      ticketIds,
    });
  } catch (error) {
    console.error("Error processing new email:", error);
  } finally {
    if (lock) {
      await lock.release();
    }
  }
};

function cleanEmailBody(emailBody) {
  return emailBody
    .replace(/----- Original message -----/g, "") // Remove original message header
    .replace(/>\s*/g, "") // Remove "> " from the start of each line
    .replace(/\n{2,}/g, "\n\n") // Replace multiple newlines with a single newline
    .replace(/From:\s*/g, "From: ") // Ensure "From:" is formatted correctly
    .replace(/To:\s*/g, "\nTo: ") // Ensure "To:" is formatted correctly
    .replace(/Cc:\s*/g, "Cc: ") // Ensure "Cc:" is formatted correctly
    .replace(/Subject:\s*/g, "\nSubject: ") // Ensure "Subject:" is formatted correctly
    .replace(/Date:\s*/g, "\nDate: ") // Ensure "Date:" is formatted correctly
    .replace(/(Date: .*)/g, "$1\n") // Add an empty line after "Date:"
    .replace(/(?:\r\n|\r|\n)/g, "\n") // Normalize newlines
    .trim();
}

function cleanSubjectText(subject) {
  return subject.startsWith("Fw: ") ? subject.slice(4).trim() : subject;
}

function extractTicketIds(subject) {
  const ticketIds = [];
  const matches = subject.match(/#(\w+)/g);
  if (matches) {
    for (const match of matches) {
      ticketIds.push(match.slice(1));
    }
  }
  return ticketIds;
}
