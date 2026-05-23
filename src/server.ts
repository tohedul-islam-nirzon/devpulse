import app from "./app.js";
import config from "./config/index.js";
import { initDB } from "./db/index.js";

// init db on cold start
initDB();

// only listen when running locally (not on vercel)
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`DevPulse server listening on port ${config.port}`);
  });
}

export default app;
