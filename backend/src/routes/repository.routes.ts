
import { Router } from "express";

import {
  connectRepository,
  getRepositories,
  getRepository,
  getRepositoryIndexStatus,
} from "../controllers/repository.controller.js";

import {
  chatWithRepository,
  streamChatWithRepository,
} from "../controllers/chat.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, connectRepository);

router.get("/", requireAuth, getRepositories);

// Keep the more specific status route before the general repository route.
router.get(
  "/:repositoryId/index-status",
  requireAuth,
  getRepositoryIndexStatus
);

router.get("/:repositoryId", requireAuth, getRepository);

router.post("/:repositoryId/chat", requireAuth, chatWithRepository);

router.post(
  "/:repositoryId/chat/stream",
  requireAuth,
  streamChatWithRepository
);

export default router;
