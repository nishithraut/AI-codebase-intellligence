
import { Router } from "express";
import {
  getConversation,
  listConversations,
} from "../controllers/conversation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listConversations);
router.get("/:conversationId", requireAuth, getConversation);

export default router;
