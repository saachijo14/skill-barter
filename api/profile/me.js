import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth-middleware.js';

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, timeBalance: true },
  });
  res.status(200).json(user);
}