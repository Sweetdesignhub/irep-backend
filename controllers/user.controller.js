

import { prisma } from "../db/prisma.js";

export const fetchAllUsers = async (req, res) => {
    try {
        console.log("Fetching all users...");

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        res.json({ message: "Users fetched successfully", users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

