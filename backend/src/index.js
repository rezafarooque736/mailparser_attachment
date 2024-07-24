import "dotenv/config";
import app from "./app.js";
import { config } from "./configs/config.js";
import connectToMongoDB from "./configs/db.js";

const PORT = config.PORT;

connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error while connecting to mongodb database", error);
  });
