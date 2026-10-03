import { createNotification, listNotifications, markNotificationRead } from '../lib/notifications';
import prisma from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  notification: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn() }
}));

describe('notifications', () => {
  it('createNotification persists and returns note', async () => {
    // @ts-ignore
    prisma.notification.create.mockResolvedValue({ id: 'n1', userId: 'u1', type: 'test', data: { message: 'hi' }, createdAt: new Date() });
    // @ts-ignore
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'u@example.com', notifyEmail: true });
    const note = await createNotification('u1', 'test', { message: 'hi' });
    expect(note).toHaveProperty('id');
  });

  it('listNotifications calls prisma', async () => {
    // @ts-ignore
    prisma.notification.findMany.mockResolvedValue([]);
    const items = await listNotifications('u1');
    expect(items).toEqual([]);
  });
});