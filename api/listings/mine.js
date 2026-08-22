import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth-middleware.js';

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
  const listings = await prisma.listing.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json(listings);
}