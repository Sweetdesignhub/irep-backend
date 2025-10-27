

import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION } from '../config/jwt.config.js';

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
