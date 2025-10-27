
import { Router } from "express";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";
import { fetchAllUsers } from "../controllers/user.controller.js";
const router = Router();

router.get("/", authenticate, fetchAllUsers);

export default router;