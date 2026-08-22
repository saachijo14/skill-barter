import { prisma } from '../_lib/prisma.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required' });
  }

  const searchRadius = radius ? parseFloat(radius) : 5000; // default 5km

  const results = await prisma.$queryRawUnsafe(
  `SELECT l.id, l.description, l.type, l."creditRate", l."createdAt", u.name as provider_name,
          s.name as skill_name, s.category,
          ST_Y(loc.geom::geometry) as lat,
          ST_X(loc.geom::geometry) as lng,
          ST_Distance(loc.geom, ST_MakePoint($1, $2)::geography) as distance_m
   FROM "Listing" l
   JOIN "User" u ON u.id = l."userId"
   JOIN "Skill" s ON s.id = l."skillId"
   JOIN locations loc ON loc.user_id = u.id
   WHERE ST_DWithin(loc.geom, ST_MakePoint($1, $2)::geography, $3)
   ORDER BY distance_m ASC`,
  parseFloat(lng), parseFloat(lat), searchRadius
);

  res.status(200).json(results);
}