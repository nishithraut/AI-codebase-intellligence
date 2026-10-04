import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running"
  });
});

app.use("/api", routes);

export default app;