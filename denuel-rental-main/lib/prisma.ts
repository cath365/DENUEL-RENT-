import { PrismaClient } from '@prisma/client';

/* eslint-disable no-unused-vars */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
/* eslint-enable no-unused-vars */

function resolveDatabaseUrl() {
  const publicUrl =
    process.env.DATABASE_PUBLIC_URL ||
    process.env.MYSQL_PUBLIC_URL;

  const configuredUrl = publicUrl || process.env.DATABASE_URL;

  if (
    process.env.VERCEL &&
    configuredUrl?.includes('.railway.internal')
  ) {
    console.error(
      'Database configuration error: Vercel cannot reach Railway private networking. ' +
      'Set DATABASE_PUBLIC_URL (or MYSQL_PUBLIC_URL) to the Railway Public Networking / TCP Proxy URL.'
    );
  }

  return configuredUrl;
}

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  global.prisma ||
  new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
