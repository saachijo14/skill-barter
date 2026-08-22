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
    const { transactionId, rating, comment } = req.body;

    if (!transactionId || !rating) {
      return res.status(400).json({ error: 'transactionId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only the requester or provider involved in this transaction can leave a review
    if (transaction.requesterId !== userId && transaction.providerId !== userId) {
      return res.status(403).json({ error: 'You are not part of this transaction' });
    }

    if (transaction.status !== 'confirmed' && transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review confirmed or completed transactions' });
    }

    const existingReview = await prisma.review.findFirst({
      where: { transactionId, },
    });
    if (existingReview) {
      return res.status(400).json({ error: 'A review already exists for this transaction' });
    }

    const review = await prisma.review.create({
      data: { transactionId, rating, comment: comment || null },
    });

    return res.status(201).json(review);
  }

  if (req.method === 'GET') {
    const { transactionId } = req.query;
    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId query parameter is required' });
    }
    const review = await prisma.review.findFirst({ where: { transactionId } });
    return res.status(200).json(review);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}