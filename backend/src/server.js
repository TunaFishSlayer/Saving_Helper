import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";

validateEnv();
connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
