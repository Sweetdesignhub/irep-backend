

import { verifyToken } from "../utils/token.util.js";
import { prisma } from "../db/prisma.js";
// import prisma from "../config/config.js";

/**
 * Middleware to verify and authenticate the user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, error: "Token is required." });
    }

    const decoded = verifyToken(token); // Decode and verify token
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

//    if (!user || !user.emailVerified) {
 //     return res.status(403).json({ success: false, error: "Unauthorized or email not verified." });
  //  }

    req.user = user; // Attach user to request object
    // console.log("USER is:", user);
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(401).json({ success: false, error: error.message });
  }
};

/**
 * Middleware to check if the authenticated user is an admin.
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "User not authenticated." });
  }
  // console.log(req.user.role);
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Access denied: Requires ADMIN privileges." });
  }

  next();
};
