import { Router } from "express";
import { createTestData } from "../controllers/test.controller.js";

const router = Router();

router.post("/data", createTestData);

export default router;