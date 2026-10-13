import { Router } from "express";

import { connectRepository, getRepositories, getRepository } from "../controllers/repository.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Connect a pulbic Github repo for the logged-in user
router.post("/", requireAuth, connectRepository)

// GET /api/repositories
// Fetch all repositories belonging to the logged-in user.
router.get("/", requireAuth, getRepositories);

// GET /api/repositories/:repositoryId
// Fetch one repository and its files by MongoDB ID.
router.get("/:repositoryId", requireAuth, getRepository);

export default router;
