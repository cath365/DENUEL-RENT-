const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin#1234', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@denuel.local' },
    update: {},
    create: {
      email: 'admin@denuel.local',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdVerified: true
    }
  });
  
  console.log('Admin user created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
