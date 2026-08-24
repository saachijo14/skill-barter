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
    const { listingId, creditsOffered } = req.body;

    if (!listingId || !creditsOffered) {
      return res.status(400).json({ error: 'listingId and creditsOffered are required' });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId === userId) {
      return res.status(400).json({ error: "You can't request your own listing" });
    }

    // requester = person asking for the service, provider = person offering it
    const transaction = await prisma.transaction.create({
      data: {
        listingId,
        requesterId: userId,
        providerId: listing.userId,
        creditsTransferred: creditsOffered,
        status: 'pending',
      },
    });

    return res.status(201).json(transaction);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}