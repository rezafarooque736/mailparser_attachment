const _config = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT,
  HPSM_HOST: process.env.HPSM_HOST,
  HPSM_PORT: process.env.HPSM_PORT,
  HPSM_PASSWORD: process.env.HPSM_PASSWORD,
  HPSM_USERNAME: process.env.HPSM_USERNAME,
  IMAP_HOST: process.env.IMAP_HOST,
  IMAP_PORT: process.env.IMAP_PORT,
  IMAP_USER: process.env.IMAP_USER,
  IMAP_PASSWORD: process.env.IMAP_PASSWORD,
};

export const config = Object.freeze(_config);
