import { Router } from "express";

import testRoutes from "./test.routes.js";
import repositoryRoutes from "./repository.routes.js";

const router = Router();

router.use("/test", testRoutes);
router.use("/repositories", repositoryRoutes);

router.get("/", (_req, res) => {
  res.json({
    message: "API is working"
  });
});

export default router;