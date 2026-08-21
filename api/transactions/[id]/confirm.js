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

  const { id } = req.query; // the transaction id, from the URL

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (transaction.providerId !== userId) {
    return res.status(403).json({ error: 'Only the provider can confirm this transaction' });
  }

  if (transaction.status !== 'pending') {
    return res.status(400).json({ error: `Transaction is already ${transaction.status}` });
  }

  const requester = await prisma.user.findUnique({ where: { id: transaction.requesterId } });
  if (requester.timeBalance < transaction.creditsTransferred) {
    return res.status(400).json({ error: 'Requester does not have enough time credits' });
  }

  // Run as a single atomic transaction: either all 3 updates happen, or none do
  const result = await prisma.$transaction([
    prisma.user.update({
      where: { id: transaction.requesterId },
      data: { timeBalance: { decrement: transaction.creditsTransferred } },
    }),
    prisma.user.update({
      where: { id: transaction.providerId },
      data: { timeBalance: { increment: transaction.creditsTransferred } },
    }),
    prisma.transaction.update({
      where: { id },
      data: { status: 'confirmed' },
    }),
  ]);

  res.status(200).json({ message: 'Transaction confirmed', transaction: result[2] });
}