import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";
import { startSubscriptionScheduler } from "./utils/subscriptionScheduler.js";

validateEnv();
connectDB().then(() => {
  // Start the background subscription automation check
  startSubscriptionScheduler();
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
