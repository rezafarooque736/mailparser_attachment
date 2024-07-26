import { ImapFlow } from "imapflow";
import { config } from "../configs/config.js";
import logger from "./logger.js";
import ApiError from "./api-error.js";
import { handleNewEmail } from "./handle-new-email.utils.js";

export const checkStatusAndUpdateJournal = async (ticketId, emailBody) => {
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

    if (!resStatusCheck.ok) {
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
        JournalUpdates: emailBody, //FIXME: Stringify emailBody before sending to HPSM
      },
    };

    const resUpdateJournal = await fetch(updateJournalUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      // redirect: "follow",
    });

    if (!resUpdateJournal.ok) {
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

class EmailListener {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1 * 60 * 1000; // 1 minute in milliseconds
    this.idleRestartInterval = 5 * 60 * 1000; // 5 minutes in milliseconds}
    this.pollInterval = 1 * 60 * 1000; // 3 minutes in milliseconds}
  }

  async connect() {
    this.client = new ImapFlow({
      host: config.IMAP_HOST,
      port: config.IMAP_PORT,
      secure: true,
      auth: {
        user: config.IMAP_USER,
        pass: config.IMAP_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
      logger: console,
    });

    try {
      await this.client.connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info("Connected to mailbox");
      this.setupEventListeners();
      this.startIdleMode();
      // Start polling for new emails every 3 minutes
      this.startPolling();
    } catch (error) {
      console.error("Failed to connect:", error);
      this.handleReconnect();
    }
  }

  startPolling() {
    setInterval(async () => {
      console.log("Polling for new emails...");
      await this.handleNewMail();
    }, this.pollInterval);
  }

  setupEventListeners() {
    console.log("Setting up event listeners...");
    this.client.on("exists", this.handleNewMail.bind(this));
    this.client.on("mail", this.handleNewMail.bind(this));
    this.client.on("error", this.handleError.bind(this));
    this.client.on("close", this.handleClose.bind(this));
  }

  async handleNewMail() {
    logger.info("New mail event detected");
    if (this.isConnected) {
      try {
        await handleNewEmail(this.client);
      } catch (error) {
        console.error("Error handling new email:", error);
      }
    }
  }

  handleError(error) {
    logger.error("IMAP client error:", {
      error: error.message,
      stack: error.stack,
    });
    this.isConnected = false;
    this.handleReconnect();
  }

  handleClose() {
    logger.info("IMAP connection closed");
    this.isConnected = false;
    this.handleReconnect();
  }

  async startIdleMode() {
    console.log("Starting IDLE mode...");
    while (this.isConnected) {
      try {
        await this.client.idle();
        await new Promise((resolve) =>
          setTimeout(resolve, this.idleRestartInterval)
        );
      } catch (error) {
        console.error("Error in IDLE mode:", error);
        break;
      }
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      logger.error(
        "Max reconnection attempts reached. Please check the connection manually."
      );
    }
  }
}

export const startEmailListener = async () => {
  console.log("Starting email listener...");
  const listener = new EmailListener();
  await listener.connect();
  await listener.handleNewMail();
};
