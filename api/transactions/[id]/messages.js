import { prisma } from '../../_lib/prisma.js';
import { requireAuth } from '../../_lib/auth-middleware.js';

const CHAT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(req, res) {
  let userId;
  try {
    userId = requireAuth(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const { id } = req.query;
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  if (transaction.requesterId !== userId && transaction.providerId !== userId) {
    return res.status(403).json({ error: 'You are not part of this transaction' });
  }

  const confirmedAt = transaction.confirmedAt;
  const expiresAt = confirmedAt ? new Date(new Date(confirmedAt).getTime() + CHAT_WINDOW_MS) : null;
  const chatOpen = !!confirmedAt && Date.now() < expiresAt.getTime();

  if (req.method === 'GET') {
    const messages = await prisma.message.findMany({
      where: { transactionId: id },
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json({ messages, chatOpen, expiresAt });
  }

  if (req.method === 'POST') {
    if (!chatOpen) {
      return res.status(403).json({ error: 'Chat window has expired or the swap is not confirmed yet' });
    }
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const message = await prisma.message.create({
      data: { transactionId: id, senderId: userId, content: content.trim() },
    });
    return res.status(201).json(message);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}