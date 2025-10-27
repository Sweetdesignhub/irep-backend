import { prisma } from "../db/prisma.js";

export const createTeam = async (data) => {
  const organization = await prisma.organization.findUnique({
    where: { id: data.organizationId, isDeleted: false }
  });

  if (!organization) {
    throw new Error("Organization not found or is deleted");
  }

  return prisma.teams.create({
    data,
    include: {
      users: true,
      organization: true
    }
  });
};

export const updateTeam = async (id, data) => {
  const team = await prisma.teams.findUnique({
    where: { id, isDeleted: false }
  });

  if (!team) {
    throw new Error("Team not found or is deleted");
  }

  return prisma.teams.update({
    where: { id },
    data,
    include: {
      users: true,
      organization: true
    }
  });
};

export const getTeamsByOrganization = async (organizationId) => {
  const organization = await prisma.organization.findUnique({
    where: {
      id: parseInt(organizationId, 10),
      isDeleted: false
    }
  });

  if (!organization) {
    throw new Error("Organization not found or is deleted");
  }

  return prisma.teams.findMany({
    where: {
      organizationId: parseInt(organizationId, 10),
      isDeleted: false
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getTeamById = async (id, userId) => {
  const teamId = parseInt(id, 10);

  if (isNaN(teamId)) {
    throw new Error("Invalid team ID");
  }

  return prisma.teams.findFirst({
    where: {
      id: teamId,
      isDeleted: false,
      OR: [
        { ownerId: userId },
        { users: { some: { id: userId } } }
      ]
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const softDeleteTeam = async (id) => {
  return prisma.$transaction(async (prisma) => {
    const team = await prisma.teams.findUnique({
      where: { id, isDeleted: false }
    });

    if (!team) {
      throw new Error("Team not found or already deleted");
    }

    return prisma.teams.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        users: {
          set: [] // Remove all user associations
        }
      }
    });
  });
};

export const restoreTeam = async (id) => {
  return prisma.$transaction(async (prisma) => {
    const team = await prisma.teams.findUnique({
      where: { id }
    });

    if (!team) {
      throw new Error("Team not found");
    }

    if (!team.isDeleted) {
      throw new Error("Team is not deleted");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: team.organizationId }
    });

    if (!organization || organization.isDeleted) {
      throw new Error("Parent organization is deleted");
    }

    return prisma.teams.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null
      },
      include: {
        users: true,
        organization: true
      }
    });
  });
};

export const hardDeleteTeam = async (id) => {
  return prisma.$transaction(async (prisma) => {
    const team = await prisma.teams.findUnique({
      where: { id }
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Remove all user associations first
    await prisma.teams.update({
      where: { id },
      data: {
        users: {
          set: []
        }
      }
    });

    // Then delete the team
    return prisma.teams.delete({
      where: { id }
    });
  });
};

