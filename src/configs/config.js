const _config = {
  // mongodb
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT,
  // hpsm
  HPSM_HOST: process.env.HPSM_HOST,
  HPSM_PORT: process.env.HPSM_PORT,
  HPSM_PASSWORD: process.env.HPSM_PASSWORD,
  HPSM_USERNAME: process.env.HPSM_USERNAME,
  // imap
  IMAP_HOST: process.env.IMAP_HOST,
  IMAP_PORT: process.env.IMAP_PORT,
  IMAP_USER: process.env.IMAP_USER,
  IMAP_PASSWORD: process.env.IMAP_PASSWORD,
  // smtp
  SMTP_SERVER: process.env.SMTP_SERVER,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USE_SSL: process.env.SMTP_USE_SSL,
  SMTP_USE_TLS: process.env.SMTP_USE_TLS,
  SMTP_DEBUG: process.env.SMTP_DEBUG,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
};

export const config = Object.freeze(_config);
