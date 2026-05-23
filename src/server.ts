import app from "./app";
import config from "./config";
import { initDB } from "./db";

// init db on cold start
initDB();

// only listen when running locally (not on vercel)
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`DevPulse server listening on port ${config.port}`);
  });
}

export default app;
