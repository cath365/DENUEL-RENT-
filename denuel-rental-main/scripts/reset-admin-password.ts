import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin#1234';
  const hash = bcrypt.hashSync(newPassword, 10);
  
  console.log('Creating/resetting admin password...');
  console.log('New hash:', hash);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@denuel.local' },
    update: { password: hash, role: 'ADMIN' },
    create: {
      email: 'admin@denuel.local',
      name: 'Admin',
      password: hash,
      role: 'ADMIN',
    }
  });
  
  console.log('Admin user ready:', user.email, '- Role:', user.role);
  console.log('Password: Admin#1234');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
