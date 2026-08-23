import { prisma } from '../../_lib/prisma.js';
import { requireAuth } from '../../_lib/auth-middleware.js';

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (transaction.providerId !== userId) {
  return res.status(403).json({ error: 'Only the provider can mark this swap as completed' });
}

if (transaction.status !== 'confirmed') {
  return res.status(400).json({ error: 'Only confirmed transactions can be marked completed' });
}

  const updated = await prisma.transaction.update({
    where: { id },
    data: { status: 'completed' },
  });

  res.status(200).json(updated);
}