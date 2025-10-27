import bcrypt from "bcrypt";
import { prisma } from "../db/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.util.js";
 
export const authenticateUser = async (email, password) => {
  // Hardcoded credentials for two users
  const users = [
    { email: "vallugu1@its.jnj.com", password: "Jnj@123", id: 1, name: "Dummy" },
    { email: "rtiwari5@its.jnj.com", password: "Jnj@2025", id: 2, name: "Rajiv Tiwari" },
  ];

  // Find matching user
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return { accessToken, refreshToken, user };
};

 
export const refreshAuthToken = (refreshToken) => {
  const decoded = verifyToken(refreshToken);
  const accessToken = generateAccessToken(decoded.userId);
  return { accessToken };
};
