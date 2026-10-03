import prisma from './prisma';
import { createNotification } from './notifications';

export async function runSavedSearches() {
  const searches = await prisma.savedSearch.findMany({ include: { user: true } });
  let searchesScanned = 0;
  let notificationsCreated = 0;
  for (const s of searches) {
    searchesScanned += 1;
    const query: any = s.queryJson || {};
    const where: any = { status: 'APPROVED' };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.priceMin || query.priceMax) { where.price = {}; if (query.priceMin) where.price.gte = query.priceMin; if (query.priceMax) where.price.lte = query.priceMax; }

    const since = s.lastNotifiedAt || s.createdAt;
    where.createdAt = { gt: since };

    const recent = await prisma.property.findMany({ where, take: 10, orderBy: { createdAt: 'desc' } });
    if (recent.length) {
      const message = `We found ${recent.length} new listings matching your saved search.`;
      await createNotification(s.userId, 'saved_search_match', {
        message,
        items: recent.map((r) => ({ id: r.id, title: r.title, price: r.price })),
      });
      notificationsCreated += 1;

      await prisma.savedSearch.update({ where: { id: s.id }, data: { lastNotifiedAt: recent[0].createdAt } });
    }
  }

  return { searchesScanned, notificationsCreated };
}

export default runSavedSearches;
