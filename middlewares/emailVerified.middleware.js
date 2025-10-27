

import { prisma } from '../db/prisma.js';

export const checkEmailVerified = async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ success: false, error: 'Email not verified' });
  }

  next();
};
