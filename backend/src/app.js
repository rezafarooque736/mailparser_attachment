import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/api-error.js";

const app = express();

// allow json body
app.use(express.json({ limit: "16kb" }));

// allow params, query params
app.use(urlencoded({ extended: true, limit: "16kb" }));

// parse cookie
app.use(cookieParser());

// import routes
import emailRouter from "./routes/mail-parser.routes.js";

app.use("/api/v1/mail", emailRouter);

// Use the error handling middleware
app.use(errorHandler);

export default app;
