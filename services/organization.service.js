import { prisma } from "../db/prisma.js";

/**
 * Create an organization
 */
export const createOrganization = async (data) => {
  return prisma.organization.create({
    data,
  });
};

/**
 * Update an organization
 */
export const updateOrganization = async (id, data) => {
  return prisma.organization.update({
    where: { id: parseInt(id, 10) },
    data,
  });
};

/**
 * Soft delete an organization
 */
export const softDeleteOrganization = async (id) => {
  return prisma.organization.update({
    where: { id: parseInt(id, 10) },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

/**
 * Restore a soft-deleted organization
 */
export const restoreOrganization = async (id) => {
  return prisma.organization.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
};

/**
 * Get all organizations accessible to the user
 */
export const getOrganizationsByUser = async (userId) => {
  return prisma.organization.findMany({
    where: {
      OR: [{ ownerId: userId }, { users: { some: { id: userId } } }],
      isDeleted: false,
    },
  });
};

/**
 * Get an organization by ID, verifying user access
 */
export const getOrganizationById = async (id, userId) => {
  return prisma.organization.findFirst({
    where: {
      id,
      isDeleted: false,
      OR: [{ ownerId: userId }, { users: { some: { id: userId } } }],
    },
  });
};

/**
 * Permanently delete an organization (hard delete).
 * @param {number} id - Organization ID to delete.
 * @returns {Promise<Object>} - The deleted organization object.
 */
export const hardDeleteOrganization = async (id) => {
  try {
    return await prisma.organization.delete({
      where: { id },
    });
  } catch (error) {
    console.error(
      `Error during hard deletion of organization ID: ${id}`,
      error
    );
    throw new Error("Failed to hard delete organization.");
  }
};
