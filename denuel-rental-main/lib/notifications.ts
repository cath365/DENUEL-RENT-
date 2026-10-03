import prisma from './prisma';
import bus from './eventBus';
import { notifyEmail } from './notify';

export async function createNotification(userId: string, type: string, data: any = {}, channel: string | null = null) {
  const note = await prisma.notification.create({ data: { userId, type, data, channel } });
  // emit for realtime subscribers
  try {
    bus.emit('notification:new', { id: note.id, userId, type, data, createdAt: note.createdAt });
  } catch (e) {
    console.warn('emit failed', e);
  }

  // enqueue send job if email channel or unspecified
  try {
    if (process.env.REDIS_URL) {
      const { enqueue } = await import('../scripts/worker/worker');
      await enqueue('notification.send', { notificationId: note.id });
    } else {
      // fallback: send immediately via email if notifyEmail true
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.notifyEmail) {
        const subject = `DENUEL Notification: ${type}`;
        const html = `<p>${data?.message || 'You have a new notification'}</p>`;
        await notifyEmail(user.email, subject, html);
        await prisma.notification.update({ where: { id: note.id }, data: { sentAt: new Date(), channel: 'email' } });
      }
    }
  } catch (e) {
    console.error('enqueue/send notification failed', e);
  }

  return note;
}

export async function markNotificationRead(id: string, userId: string) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== userId) throw new Error('Not found');
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit });
}

const notifications = { createNotification, markNotificationRead, listNotifications };
export default notifications;