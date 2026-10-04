import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`);
  });
};



startServer();