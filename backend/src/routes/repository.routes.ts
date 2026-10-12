import { Router } from "express";

import { getRepositories, getRepository } from "../controllers/repository.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/repositories
// Fetch all repositories belonging to the logged-in user.
router.get("/", requireAuth, getRepositories);

// GET /api/repositories/:repositoryId
// Fetch one repository and its files by MongoDB ID.
router.get("/:repositoryId", requireAuth, getRepository);

export default router;
