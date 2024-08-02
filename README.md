# RailTel Attach Mail Parser

## Introduction:

This is a microservice that parses the mail and take appropriate action based on the mail Subject, content. if subject has valid hpsm ticket id then it will update Journal in hpsm. otherrwise it will sent back mail to the sender with error message.

#### Usage - All the L2, L3 employee of RailTel Corporation of India Ltd. uses this service. for hpsm Journal Update

## Technology Stacks:

- [express](https://expressjs.com) - web framework for Node.js to create rest api
- [node-fetch](https://github.com/node-fetch/node-fetch) - A light-weight module that brings Fetch API to Node.js.
- [dotenv](https://www.dotenvx.com/) - loads environment variables from a .env file into process.env
- [cors](https://github.com/expressjs/cors#readme) - enable CORS with various options in Node.js
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit) - rate limiting middleware for Express.js
- [helmet](https://helmetjs.github.io/) - helps secure Express apps by setting various HTTP headers.
- [html-to-text](https://github.com/werk85/node-html-to-text) - Convert HTML to text
- [imapflow](https://github.com/mscdex/node-imapflow) - A simple IMAP client library for Node.js
- [mailparser](https://github.com/nodemailer/mailparser) - Parse e-mail messages to structured objects
- [nodemailer](https://nodemailer.com/about/) - Node.js module to send emails
- [winston](https://github.com/winstonjs/winston) - A logger for just about everything.

## Folder Structure:

- route in /src

## Installation:

```bash
npm run dev
```

## Deploy on local server

- use dockerfile to build image and run container

```bash
sudo docker compose build
sudo docker compose up -d
```
