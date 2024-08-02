import { Router } from "express";
import {
  attachmentMailParser,
  healthCheck,
} from "../controllers/attachment-mail-parser.controllers.js";

const emailRouter = Router();

emailRouter.get("/attachment", attachmentMailParser);
emailRouter.get("/health", healthCheck);

export default emailRouter;
