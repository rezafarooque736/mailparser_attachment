import { simpleParser } from "mailparser";
import {
  isHPSMticketValid,
  updateHPSMJournal,
} from "./attachment-mail.utils.js";
import logger from "./logger.js";
import { replyToEmail } from "./sendmail.js";
import { convert } from "html-to-text";

export const handleNewEmail = async (client) => {
  let lock;
  try {
    lock = await client.getMailboxLock("INBOX");

    const message = await client.fetchOne("*", {
      envelope: true,
      source: true,
    });

    if (!message) {
      logger.info("No new message found");
      return;
    }

    const subject = message.envelope.subject
      ? message.envelope.subject.replace("Fw: ", "")
      : "No Subject";
    const date = new Date(message.envelope.date);
    const senderEmail = message.envelope.sender[0].address;
    const senderName = message.envelope.sender[0].name;
    const messageId = message.envelope.messageId;

    // const { text: emailContent } = await simpleParser(message.source);
    const parsed = await simpleParser(message.source);

    // Extract the plain text or HTML content
    let emailContent = parsed.text || parsed.html;
    // If the content is HTML, convert it to plain text
    const latestMailContent = extractLatestEmailContent(emailContent);

    // Clean up the email Body
    let cleanedEmailContent = cleanEmailContent(latestMailContent); // Trim leading and trailing spaces

    if (!cleanedEmailContent) {
      logger.info("Email body is empty");
      let textBody = "The body of your email is empty.";
      let htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Dear ${senderName},</p>
          <p>We noticed that the body of your email is empty. Please include the necessary details in the email body and resend your email.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p></br>
          <p>Thank you for your cooperation.</p>
          <p>Best regards,<br>SOC Support Team</p>
        </div>
      `;
      replyToEmail(senderEmail, subject, textBody, htmlBody, messageId)
        .then(async () => {
          logger.info("Email sent successfully");
          return await client.messageDelete("*");
        })
        .then(() => logger.info("Email deleted successfully"))
        .catch((error) => logger.error("Error sending email:", error));
      return;
    }

    // Extract ticket IDs
    const ticketIds = await extractTicketIds(subject);

    if (!ticketIds.length) {
      logger.info("No ticket IDs found in email subject");
      let textBody = "No ticket IDs found in email subject";
      let htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Dear ${senderName},</p>
          <p>We were unable to locate any valid ticket IDs in the subject of your email.</p>
          <p>Please ensure that the ticket number is correctly mentioned in the subject line. For updating the ticket, the subject line must prepend with "#" followed by the ticket ID (e.g., #IM1234567).</p>
          <p>Kindly correct the ticket number and resend your email.</p>
          </br>
          <p>Thank you for your cooperation.</p>
          <p>Best regards,<br>SOC Support Team</p>
        </div>
      `;

      replyToEmail(senderEmail, subject, textBody, htmlBody, messageId)
        .then(async () => {
          logger.info("Email sent successfully");
          return await client.messageDelete("*");
        })
        .then(() => logger.info("Email deleted successfully"))
        .catch((error) => logger.error("Error sending email:", error));
      return;
    }

    for (let ticketId of ticketIds) {
      const { message, success } = await updateHPSMJournal(
        ticketId,
        cleanedEmailContent
      );

      // success is true then delete last email from INBOX
      if (success) {
        await client.messageDelete("*");
        continue;
      }

      logger.info(
        `Ticket ${ticketId} update status: ${
          success ? "Success" : "Failed"
        }, Message: ${message}`
      );
    }
  } catch (error) {
    console.error("Error processing new email:", error);
  } finally {
    if (lock) {
      await lock.release();
    }
  }
};

function extractLatestEmailContent(emailContent) {
  let latestEmailContent = null;
  // Check if the content is HTML
  if (emailContent.trim().startsWith("<")) {
    // Convert HTML to plain text
    latestEmailContent = convert(emailContent, {
      wordwrap: 130,
      preserveNewlines: true,
      selectors: [
        { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
        { selector: "img", format: "skip" },
      ],
    });
  } else {
    // Content is already plain text, return as is
    latestEmailContent = emailContent;
  }
  // Split the content by the 'Original message' delimiter
  const parts = latestEmailContent.split("----- Original message -----");
  // If the delimiter is found, return the first part
  // If the delimiter is not found, return the entire content
  if (parts.length === 1) {
    //when email body doesn't contains "----- Original message -----"
    return parts[0].trim();
  } else {
    if (parts[0].trim() === ">") {
      //trailing mail can not contains extra message on very top of mail outside of trail
      return parts[1].trim();
    } else {
      //trailing mail can contains extra message on very top of mail outside of trail
      return parts[0].trim();
    }
  }
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
}

function cleanEmailContent(emailContent) {
  return emailContent
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

async function extractTicketIds(subject) {
  const ticketIds = [];
  const matches = subject.match(/#(\w+)/g);
  if (matches) {
    for (const match of matches) {
      const { success } = await isHPSMticketValid(match.slice(1));
      if (success) {
        ticketIds.push(match.slice(1));
      }
    }
  }
  return ticketIds;
}
