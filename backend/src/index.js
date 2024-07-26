import "dotenv/config";
import app from "./app.js";
import { config } from "./configs/config.js";
import connectToMongoDB from "./configs/db.js";
import logger from "./utils/logger.js";

const PORT = config.PORT;

connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running at port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Error while connecting to MongoDB database", error);
    process.exit(1);
  });
