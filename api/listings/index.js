import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth-middleware.js';

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  if (req.method === 'POST') {
    const { skillId, type, description, lat, lng, creditRate } = req.body;

    if (!skillId || !type || !description || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'skillId, type, description, lat, and lng are required' });
    }

    const listing = await prisma.listing.create({
    data: { userId, skillId, type, description, creditRate: creditRate || 1 },
    });

    await prisma.$executeRawUnsafe(
      `INSERT INTO locations (user_id, geom)
       VALUES ($1, ST_MakePoint($2, $3)::geography)
       ON CONFLICT (user_id) DO UPDATE SET geom = EXCLUDED.geom`,
      userId, lng, lat
    );

    return res.status(201).json(listing);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}