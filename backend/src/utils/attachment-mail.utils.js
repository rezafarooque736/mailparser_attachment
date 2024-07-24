import { ImapFlow } from "imapflow";
import { config } from "../configs/config.js";
import { simpleParser } from "mailparser";
import ApiError from "./api-error.js";

// Function to connect to the mailbox using Ethereal SMTP server details.
export const connectToMailbox = async () => {
  const client = new ImapFlow({
    host: config.IMAP_HOST,
    port: config.IMAP_PORT,
    secure: true,
    auth: {
      user: config.IMAP_USER,
      pass: config.IMAP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    clientInfo: {
      name: false,
      "support-url": false,
      vendor: false,
      date: false,
    },
  });

  client.on("error", (err) => {
    client.log.error(err);
  });
  client.on("close", (...args) => {
    console.log("CLOSE");
    console.log("args", ...args);
  });

  client.on("mailboxOpen", (...args) => {
    console.log("MAILBOX:OPEN");
    console.log("args", ...args);
  });

  client.on("mailboxClose", (...args) => {
    console.log("MAILBOX:CLOSE");
    console.log("args", ...args);
  });

  client.on("flags", (updateEvent) => {
    console.log("FLAGS UPDATE");
    console.log(util.inspect(updateEvent, false, 22));
  });

  client.on("exists", (updateEvent) => {
    console.log("EXISTS UPDATE");
    console.log(util.inspect(updateEvent, false, 22));
  });

  client.on("expunge", (updateEvent) => {
    console.log("EXPUNGE UPDATE");
    console.log(util.inspect(updateEvent, false, 22));
  });

  await client.connect(); // Connect to the mailbox
  return client;
};

export async function fetchLastEmail(connection) {
  let message = await connection.fetchOne("*", {
    // envelope: true,
    // flags: true,
    source: true,
  });

  if (!message) {
    return {
      message: "Either there is no message or has been deleted",
      success: false,
    };
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
    return {
      message: "Either there is no message or has been deleted",
      success: false,
    };
  }

  // Remove "Fw: " from the start of the subject if it exists
  const cleanedSubject = subject.startsWith("Fw: ")
    ? subject.slice(4).trim()
    : subject;

  // Extract ticket IDs
  const ticketIds = [];
  const ticketIdMatches = cleanedSubject.match(/#(\w+)/g);
  if (ticketIdMatches) {
    for (const match of ticketIdMatches) {
      ticketIds.push(match.slice(1)); // Remove the "#" and store the ticket ID
    }
  }
  // Clean up the emailBody
  let cleanedEmailBody = emailBody
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
    .trim(); // Trim leading and trailing spaces

  return {
    emailBody: cleanedEmailBody,
    subject: cleanedSubject,
    date,
    from,
    ticketIds,
    success: true,
  };
}

export const checkStatusOfTicket = async (ticketId, emailBody) => {
  const queryStatusCheck = `IncidentID="${ticketId}" and not (StatusIM="Resolved" or StatusIM="Closed")`;
  const encodedQueryStatusCheck = encodeURIComponent(queryStatusCheck);

  const statusCheckUrl = `http://${config.HPSM_HOST}:${config.HPSM_PORT}/SM/9/rest/incidents?query=${encodedQueryStatusCheck}`;

  // Create a base64 encoded string for Basic Auth
  const auth = Buffer.from(
    `${config.HPSM_USERNAME}:${config.HPSM_PASSWORD}`
  ).toString("base64");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  };

  try {
    // Fetch request with Basic Auth
    const resStatusCheck = await fetch(statusCheckUrl, {
      method: "GET",
      headers,
    });

    if (resStatusCheck.status !== 200) {
      throw new ApiError(
        resStatusCheck.status,
        `Error fetching data from HPSM: ${resStatusCheck.statusText}`
      );
    }

    const jsonResStatusCheck = await resStatusCheck.json();
    // if ticket is is resolved, closed or invalid ticket id return false
    if (!jsonResStatusCheck["@count"]) {
      return {
        message: "Ticket is resolved, closed or invalid ticket id",
        success: false,
      };
    }

    // send emailBody to HPSM to update journal of the ticket.
    const updateJournalUrl = `http://${config.HPSM_HOST}:${config.HPSM_PORT}/SM/9/rest/incidents/${ticketId}`;

    const body = {
      Incident: {
        JournalUpdates: emailBody,
      },
    };

    const resUpdateJournal = await fetch(updateJournalUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      // redirect: "follow",
    });

    if (resUpdateJournal.status !== 200) {
      throw new ApiError(
        resUpdateJournal.status,
        `Error fetching data from HPSM: ${resUpdateJournal.statusText}`
      );
    }

    return {
      message: "Ticket updated successfully",
      success: true,
    };
  } catch (error) {
    console.log("Error:", error);
    // Handle network errors, server errors, and unexpected errors.
    return {
      message,
      success: false,
    };
  }
};

export async function deleteAll(path) {
  let lock = await client.getMailboxLock(path);
  try {
    await client.messageDelete("1:*");
  } finally {
    lock.release();
  }
}
