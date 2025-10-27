import { Router } from "express";
import {
  createOrg,
  deleteOrg,
  getOrgById,
  getOrgs,
  undoDeleteOrg,
  updateOrg,
  getTeamsByOrganizationId,
} from "../controllers/organization.controller.js";
import { authenticate, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes for organizations
// router.post("/", authenticate, isAdmin, createOrg); // Create organization
// router.put("/:id", authenticate, isAdmin, updateOrg); // Update organization
// router.delete("/:id", authenticate, isAdmin, deleteOrg); // Soft delete organization
// router.post("/:id/undo", authenticate, isAdmin, undoDeleteOrg); // Undo delete
router.get("/", authenticate, getOrgs); // View organizations
router.get("/:id", authenticate, getOrgById); // Get organization by ID

router.post("/",  createOrg); // Create organization
router.put("/:id", authenticate, updateOrg); // Update organization
router.delete("/:id", authenticate, deleteOrg); // Soft delete organization
router.post("/:id/undo", authenticate, undoDeleteOrg); // Undo delete
router.get("/:orgId/teams", getTeamsByOrganizationId);

export default router;
