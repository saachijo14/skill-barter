import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth-middleware.js';

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ requesterId: userId }, { providerId: userId }] },
    orderBy: { createdAt: 'desc' },
  });

  const listingIds = [...new Set(transactions.map((t) => t.listingId))];
  const userIds = [...new Set(transactions.flatMap((t) => [t.requesterId, t.providerId]))];

  const [listings, users] = await Promise.all([
    prisma.listing.findMany({ where: { id: { in: listingIds } }, include: { skill: true } }),
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
  ]);

  const listingMap = Object.fromEntries(listings.map((l) => [l.id, l]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const enriched = transactions.map((t) => ({
    ...t,
    skillName: listingMap[t.listingId]?.skill?.name || 'Unknown Skill',
    requesterName: userMap[t.requesterId] || 'Unknown',
    providerName: userMap[t.providerId] || 'Unknown',
  }));

  res.status(200).json(enriched);
}