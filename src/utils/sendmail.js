import nodemailer from "nodemailer";
import { config } from "../configs/config.js";

class EmailService {
  constructor() {
    // Create a transporter object
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_SERVER,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === "465",
      auth: {
        user: config.SMTP_USERNAME,
        pass: config.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async replyToEmail({ to, subject, text, html, inReplyTo }) {
    const mailOptions = {
      from: '"Attachment Email Parser" <attach@railtelindia.com>',
      to,
      subject: "Re: " + subject,
      text: text,
      html:
        html +
        "\n\n" +
        "<h4>If this mail is irrelevant, kindly remove attach@railtelindia.com</h4>",
      inReplyTo: inReplyTo,
      references: [inReplyTo],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}

const emailService = new EmailService();
export const replyToEmail = async (to, subject, text, html, inReplyTo) => {
  return emailService.replyToEmail({ to, subject, text, html, inReplyTo });
};
