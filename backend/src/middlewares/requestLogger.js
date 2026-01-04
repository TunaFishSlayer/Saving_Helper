import morgan from "morgan";
import logger from "../utils/logger.js";

const requestLogger = morgan(
  ":method :url :status :response-time ms",
  {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }
);

export default requestLogger;
