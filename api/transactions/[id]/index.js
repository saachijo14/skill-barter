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
  const { action } = req.body;

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (action === 'confirm') {
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
        data: { status: 'confirmed', confirmedAt: new Date() },
      }),
    ]);
    return res.status(200).json({ message: 'Transaction confirmed', transaction: result[2] });
  }

  if (action === 'complete') {
  if (transaction.providerId !== userId) {
    return res.status(403).json({ error: 'Only the provider can mark this swap as completed' });
  }
  if (transaction.status !== 'confirmed') {
    return res.status(400).json({ error: 'Only confirmed transactions can be marked completed' });
  }
  const updated = await prisma.transaction.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  });
  return res.status(200).json(updated);
}

    if (action === 'cancel') {
  if (transaction.requesterId !== userId && transaction.providerId !== userId) {
    return res.status(403).json({ error: 'You are not part of this transaction' });
  }
  if (transaction.status !== 'completed') {
    return res.status(400).json({ error: 'Only completed swaps can be cancelled' });
  }
  const CANCEL_WINDOW_MS = 15 * 60 * 1000;
  const completedAt = transaction.completedAt ? new Date(transaction.completedAt).getTime() : 0;
  if (Date.now() - completedAt > CANCEL_WINDOW_MS) {
    return res.status(400).json({ error: 'Cancel window has expired' });
  }

  const result = await prisma.$transaction([
    prisma.user.update({
      where: { id: transaction.requesterId },
      data: { timeBalance: { increment: transaction.creditsTransferred } },
    }),
    prisma.user.update({
      where: { id: transaction.providerId },
      data: { timeBalance: { decrement: transaction.creditsTransferred } },
    }),
    prisma.transaction.update({
      where: { id },
      data: { status: 'cancelled' },
    }),
  ]);
  return res.status(200).json({ message: 'Swap cancelled and credits refunded', transaction: result[2] });
}
  return res.status(400).json({ error: 'Invalid action' });
}