import { Router } from "express";

import testRoutes from "./test.routes.js";
import repositoryRoutes from "./repository.routes.js";
import authRoutes from "./auth.routes.js";
import conversationRoutes from "./conversation.routes.js";

const router = Router();

router.use("/test", testRoutes);
router.use("/repositories", repositoryRoutes);
router.use("/conversations", conversationRoutes);
router.use("/auth", authRoutes);

router.get("/", (_req, res) => {
  res.json({
    message: "API is working"
  });
});

export default router;