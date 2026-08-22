import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth-middleware.js';

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, timeBalance: true },
    });
    return res.status(200).json(user);
  }

  if (req.method === 'POST') {
    const { lat, lng, bio } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO locations (user_id, geom)
       VALUES ($1, ST_MakePoint($2, $3)::geography)
       ON CONFLICT (user_id) DO UPDATE SET geom = EXCLUDED.geom`,
      userId, lng, lat
    );

    if (bio !== undefined) {
      await prisma.user.update({ where: { id: userId }, data: { bio } });
    }

    return res.status(200).json({ message: 'Profile updated' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}