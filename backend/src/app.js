import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import requestLogger from "./middlewares/requestLogger.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(morgan("dev"));
app.use("/api", routes);

const swaggerPath = path.join(process.cwd(), "src/docs/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
