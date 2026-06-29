import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'testadmin@cust.pk';
  const plainPassword = 'Testadmin1@';
  const password = await bcrypt.hash(plainPassword, 12);
  const referralCode = `TESTADMIN-${Date.now()}`;

  await prisma.user.upsert({
    where: { email },
    update: { password },
    create: {
      name: 'Test Admin',
      email,
      password,
      role: 'admin',
      status: 'active',
      referralCode,
    },
  });

  console.log(`Admin created: ${email} / ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
