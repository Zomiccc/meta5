import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@broker.pk' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@broker.pk',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      referralCode: 'ADMIN001',
    },
  });

  const clientPassword = await bcrypt.hash('Client123!', 12);
  const client = await prisma.user.upsert({
    where: { email: 'client@broker.pk' },
    update: {},
    create: {
      name: 'Demo Client',
      email: 'client@broker.pk',
      password: clientPassword,
      role: 'client',
      status: 'active',
      referralCode: 'CLIENT001',
    },
  });

  await prisma.affiliate.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
      referralCode: 'CLIENT001',
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
