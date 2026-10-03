const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@denuel.local' },
    select: { id: true, email: true, role: true, name: true, password: true }
  });
  console.log('Admin user:', admin);
  if (admin) {
    console.log('Password hash length:', admin.password ? admin.password.length : 'no-password');
    const bcrypt = require('bcryptjs');
    const testPasswords = ['Admin#1234', 'Admin1234', 'password', 'Admin@123'];
    testPasswords.forEach(p => {
      const ok = bcrypt.compareSync(p, admin.password);
      console.log(`compare '${p}':`, ok);
    });
  }
  await prisma.$disconnect();
}

main();
