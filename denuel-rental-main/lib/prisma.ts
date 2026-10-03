import { PrismaClient } from '@prisma/client';

/* eslint-disable no-unused-vars */
// Prevent multiple instances of Prisma Client in development (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
/* eslint-enable no-unused-vars */

// create prisma client and export
export const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// keep default for backwards compatibility
export default prisma;