import { Router } from "express";
import { getRepository } from "../controllers/repository.controller.js";

const router = Router();

router.get("/:repositoryId", getRepository);

export default router;