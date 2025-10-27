import { Router } from "express";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";
import { createTeamHandler, deleteTeamHandler, hardDeleteTeamHandler, undoDeleteTeamHandler, updateTeamHandler, getTeamsHandler, getTeamByIdHandler, addTeamMember, createsTeam, updatesTeam, deleteTeam, removeTeamMember } from "../controllers/teams.controller.js";

const router = Router();

/**
 * Admin-only routes
 */

// router.post("/create", authenticate, isAdmin, createTeamHandler);
// router.put("/:id", authenticate, isAdmin, updateTeamHandler);
// router.delete("/:id", authenticate, isAdmin, deleteTeamHandler);
// router.post("/:id/undo", authenticate, isAdmin, undoDeleteTeamHandler);
// router.delete("/:id/hard", authenticate, isAdmin, hardDeleteTeamHandler);

router.post("/create", authenticate, createsTeam);
router.put("/:teamId", authenticate, updatesTeam);
router.delete("/:teamId", authenticate, deleteTeam);
router.post("/:id/undo", authenticate, undoDeleteTeamHandler);
router.delete("/:id/hard", authenticate, hardDeleteTeamHandler);
router.post("/:teamId/add-member", authenticate, addTeamMember);
router.delete("/:teamId/remove-member/:userId", authenticate, removeTeamMember);

/**
 * Get teams accessible to the user
 */
router.get("/:organizationId", authenticate, getTeamsHandler);
router.get("/team/:id", authenticate, getTeamByIdHandler);

export default router;
