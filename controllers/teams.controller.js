import { createTeam, getTeamById, getTeamsByOrganization, hardDeleteTeam, restoreTeam, softDeleteTeam, updateTeam } from "../services/teams.service.js";
import { prisma } from "../db/prisma.js";

// export const createTeamHandler = async (req, res, next) => {
//   try {
//     const { name, description, organizationId } = req.body;

//     if (!name || !description || !organizationId) {
//       return res.status(400).json({
//         success: false,
//         error: "Missing required fields"
//       });
//     }

//     const team = await createTeam({
//       name,
//       description,
//       organizationId,
//       ownerId: req.user.id
//     });

//     res.status(201).json({ success: true, data: team });
//   } catch (error) {
//     next(error);
//   }
// };
export const createTeamHandler = async function createTeam(req, res) {
  const { name, description, organizationId, ownerId, userIds } = req.body;
  try {
    const team = await prisma.teams.create({
      data: {
        name,
        description,
        organizationId,
        ownerId,
        users: {
          connect: userIds.map(id => ({ id }))
        }
      },
      include: {
        users: true // Include users in the return object
      }
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: "Failed to create team", details: error });
  }
}


export const updateTeamHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && !description) {
      return res.status(400).json({
        success: false,
        error: "No update data provided"
      });
    }

    const team = await updateTeam(id, {
      name,
      description,
      updatedAt: new Date()
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found"
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const getTeamsHandler = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const teams = await getTeamsByOrganization(organizationId);
    res.status(200).json({
      success: true,
      data: teams.filter(team => !team.isDeleted)
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await getTeamById(id, userId);

    if (!team || team.isDeleted) {
      return res.status(404).json({
        success: false,
        error: "Team not found or access denied"
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const deleteTeamHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await getTeamById(id, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found or access denied"
      });
    }

    if (team.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only team owner can delete the team"
      });
    }

    await softDeleteTeam(id);
    res.status(200).json({
      success: true,
      message: "Team deleted. Undo available for 10 seconds"
    });
  } catch (error) {
    next(error);
  }
};

export const undoDeleteTeamHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await getTeamById(id, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found or access denied"
      });
    }

    if (team.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only team owner can restore the team"
      });
    }

    const restoredTeam = await restoreTeam(id);
    res.status(200).json({ success: true, data: restoredTeam });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteTeamHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await getTeamById(id, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team not found or access denied"
      });
    }

    if (team.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only team owner can permanently delete the team"
      });
    }

    await hardDeleteTeam(id);
    res.status(200).json({
      success: true,
      message: "Team permanently deleted"
    });
  } catch (error) {
    next(error);
  }
};


export const createsTeam = async (req, res) => {
  const { name, description, organizationId, ownerId, userIds } = req.body;
  try {
    const team = await prisma.teams.create({
      data: {
        name,
        description,
        organizationId,
        ownerId,
        users: {
          connect: userIds.map(id => ({ id }))
        }
      },
      include: {
        users: true // Include users in the return object
      }
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: "Failed to create team", details: error });
  }
}

export const addTeamMember = async (req, res) => {
  const { teamId } = req.params; // Extract teamId from request parameters
  const { email } = req.body; // Extract email from request body

  try {
    // Parse teamId to an integer
    const parsedTeamId = parseInt(teamId);
    if (isNaN(parsedTeamId)) {
      return res.status(400).json({ error: "Invalid teamId" });
    }

    // Check if the team exists
    const team = await prisma.teams.findUnique({
      where: { id: parsedTeamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add the user to the team
    const updatedTeam = await prisma.teams.update({
      where: { id: parsedTeamId },
      data: {
        users: {
          connect: { id: user.id }, // Connect the user to the team
        },
      },
      include: { users: true }, // Include the updated list of users in the response
    });

    // Return the updated team with the new member
    res.status(200).json({
      success: true,
      message: "Team member added successfully!",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add team member",
      details: error.message,
    });
  }
};

export const updatesTeam = async (req, res) => {
  const { teamId } = req.params; // Extract teamId from request parameters
  const { name, description, ownerId } = req.body; // Extract updated details from request body

  try {
    // Parse teamId to an integer
    const parsedTeamId = parseInt(teamId);
    if (isNaN(parsedTeamId)) {
      return res.status(400).json({ error: "Invalid teamId" });
    }

    // Check if the team exists
    const team = await prisma.teams.findUnique({
      where: { id: parsedTeamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Validate ownerId (if provided)
    if (ownerId) {
      const parsedOwnerId = parseInt(ownerId);
      if (isNaN(parsedOwnerId)) {
        return res.status(400).json({ error: "Invalid ownerId" });
      }

      // Check if the new owner exists
      const newOwner = await prisma.user.findUnique({
        where: { id: parsedOwnerId },
      });

      if (!newOwner) {
        return res.status(404).json({ error: "New owner not found" });
      }
    }

    // Update the team
    const updatedTeam = await prisma.teams.update({
      where: { id: parsedTeamId },
      data: {
        name, // Update name if provided
        description, // Update description if provided
        ownerId: ownerId ? parseInt(ownerId) : undefined, // Update ownerId if provided
      },
      include: {
        users: true, // Include the list of users in the response
        owner: true, // Include the owner details in the response
      },
    });

    // Return the updated team
    res.status(200).json({
      success: true,
      message: "Team updated successfully!",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update team",
      details: error.message,
    });
  }
};


export const getAllTeams = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const teams = await prisma.teams.findMany({
      where: {
        organizationId: parseInt(organizationId, 10),
        isDeleted: false, // Fetch only active teams
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      memberCount: team.users.length,
      members: team.users,
    }));

    res.json({ message: "Teams fetched successfully", teams: formattedTeams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Fetch a specific team by ID along with its users
 */
export const getsTeamByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.teams.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ message: "Team fetched successfully", team });
  } catch (error) {
    console.error("Error fetching team details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteTeam = async (req, res) => {
  const { teamId } = req.params; // Extract teamId from request parameters

  try {
    // Parse teamId to an integer
    const parsedTeamId = parseInt(teamId);
    if (isNaN(parsedTeamId)) {
      return res.status(400).json({ error: "Invalid teamId" });
    }

    // Check if the team exists
    const team = await prisma.teams.findUnique({
      where: { id: parsedTeamId },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Perform a soft delete
    const deletedTeam = await prisma.teams.update({
      where: { id: parsedTeamId },
      data: {
        isDeleted: true, // Mark the team as deleted
        deletedAt: new Date(), // Set the deletion timestamp
      },
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Team deleted successfully!",
      data: deletedTeam,
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete team",
      details: error.message,
    });
  }
};


export const removeTeamMember = async (req, res) => {
  const { teamId, userId } = req.params; // Extract teamId and userId from request parameters

  try {
    // Parse teamId and userId to integers
    const parsedTeamId = parseInt(teamId);
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedTeamId) || isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid teamId or userId" });
    }

    // Check if the team exists
    const team = await prisma.teams.findUnique({
      where: { id: parsedTeamId },
      include: { users: true }, // Include the list of users in the team
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if the user exists in the team
    const userInTeam = team.users.some((user) => user.id === parsedUserId);
    if (!userInTeam) {
      return res.status(404).json({ error: "User not found in the team" });
    }

    // Remove the user from the team
    await prisma.teams.update({
      where: { id: parsedTeamId },
      data: {
        users: {
          disconnect: { id: parsedUserId }, // Disconnect the user from the team
        },
      },
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Team member removed successfully!",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove team member",
      details: error.message,
    });
  }
};