import { Router } from "express";
import { attachmentMailParser } from "../controllers/attachment-mail-parser.controllers.js";

const emailRouter = Router();

emailRouter.route("/attachment").get(attachmentMailParser);

export default emailRouter;
