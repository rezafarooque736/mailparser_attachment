import mongoose from "mongoose";
import { config } from "./config.js";

const connectToMongoDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(config.MONGODB_URI);

    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Error while getting connected to mongo db database", error);
    process.exit(1);
  }
};

export default connectToMongoDB;
