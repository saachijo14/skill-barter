import { prisma } from '../_lib/prisma.js';

export default async function handler(req, res) {
  const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
  res.status(200).json(skills);
}