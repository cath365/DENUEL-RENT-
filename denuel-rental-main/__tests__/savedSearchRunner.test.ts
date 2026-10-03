import prisma from '../lib/prisma';
import { runSavedSearches } from '../lib/savedSearchRunner';

jest.mock('../lib/prisma', () => ({
  savedSearch: { findMany: jest.fn(), update: jest.fn() },
  property: { findMany: jest.fn() }
}));

jest.mock('../lib/notifications', () => ({
  createNotification: jest.fn(),
}));

describe('savedSearchRunner', () => {
  it('runs without error when no saved searches', async () => {
    // @ts-ignore
    prisma.savedSearch.findMany.mockResolvedValue([]);
    await expect(runSavedSearches()).resolves.toEqual({ searchesScanned: 0, notificationsCreated: 0 });
  });

  it('handles simple saved search flow', async () => {
    const fakeSearch = {
      id: 's1',
      userId: 'u1',
      queryJson: { city: 'Lusaka' },
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      lastNotifiedAt: null,
      user: { email: 'u@example.com' },
    };
    // @ts-ignore
    prisma.savedSearch.findMany.mockResolvedValue([fakeSearch]);
    // @ts-ignore
    prisma.property.findMany.mockResolvedValue([{ id: 'p1', title: 'Home', price: 100, createdAt: new Date('2025-01-02T00:00:00.000Z') }]);

    // @ts-ignore
    prisma.savedSearch.update.mockResolvedValue({ ...fakeSearch, lastNotifiedAt: new Date('2025-01-02T00:00:00.000Z') });

    await expect(runSavedSearches()).resolves.toEqual({ searchesScanned: 1, notificationsCreated: 1 });
  });
});
