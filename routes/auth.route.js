import { Router } from "express";
import {
  refreshToken,
  // registerUser,
  signIn,
  signOut,
  // verifyEmail,
  validateToken,
} from "../controllers/auth.controller.js";

const router = Router();

// User registration route
// router.post("/sign-up", registerUser);
// router.get("/verify-email", verifyEmail);
router.post("/sign-in", signIn);
router.post("/refresh-token", refreshToken);
router.post("/sign-out", signOut);
router.post("/validate-token", validateToken);

export default router;
