import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { processImageKey } from '../../lib/imageProcessor';
import prisma from '../../lib/prisma';
import { notifyEmail } from '../../lib/notify';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const queueName = 'denuel-jobs';
const queue = new Queue(queueName, { connection });

console.log('Worker starting, connecting to redis...');

const worker = new Worker(queueName, async (job) => {
  console.log('Processing job', job.name, job.data);
  if (job.name === 'image.process') {
    const { key, propertyId } = job.data;
    const variants = await processImageKey(key);
    if (propertyId) {
      let last = await prisma.propertyImage.findFirst({ where: { propertyId }, orderBy: { sortOrder: 'desc' } });
      let base = last ? last.sortOrder + 1 : 0;
      for (const v of variants) {
        await prisma.propertyImage.create({ data: { propertyId, url: v.publicUrl, sortOrder: base++ } });
      }
    }
    return { ok: true, variants };
  }

  if (job.name === 'savedsearch.run') {
    const { runSavedSearches } = await import('../../lib/savedSearchRunner');
    await runSavedSearches();
    return { ok: true };
  }

  if (job.name === 'notification.send') {
    const { notificationId } = job.data as any;
    const note = await prisma.notification.findUnique({ where: { id: notificationId }, include: { user: true } });
    if (!note) return { ok: false, message: 'Notification not found' };

    // send email if user has opted in
    if (note.user.notifyEmail) {
      const subject = `DENUEL Notification: ${note.type}`;
      const html = `<p>${
        note.data && typeof note.data === 'object' && 'message' in note.data
          ? (note.data as { message?: string }).message
          : 'You have a new notification'
      }<p>`;
      try {
        await notifyEmail(note.user.email, subject, html);
        await prisma.notification.update({ where: { id: note.id }, data: { sentAt: new Date(), channel: 'email' } });
      } catch (e) {
        console.error('failed sending notification email', e);
      }
    }

    // TODO: integrate other channels (WhatsApp, push)
    return { ok: true };
  }

  return { ok: false, message: 'Unknown job' };
}, { connection });

worker.on('completed', (job) => console.log('Job completed', job.id, job.name));
worker.on('failed', (job, err) => console.error('Job failed', job?.id, err));

// export for ad-hoc enqueueing
export async function enqueue(jobName: string, data: any) {
  await queue.add(jobName, data, { removeOnComplete: true, removeOnFail: false });
}

if (require.main === module) {
  console.log('Worker running');
}
