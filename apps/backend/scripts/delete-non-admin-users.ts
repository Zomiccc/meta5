import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true },
  });

  console.log(`Keeping ${admins.length} admin(s):`, admins.map((a) => a.email).join(', '));

  // Clear self-referral links so deletion doesn't fail
  await prisma.user.updateMany({
    where: { role: { not: 'admin' } },
    data: { referredBy: null },
  });

  // Delete open trades for non-admin users
  const tradesDeleted = await prisma.openTrade.deleteMany({
    where: {
      userId: { notIn: admins.map((a) => a.id) },
    },
  });
  console.log(`Deleted ${tradesDeleted.count} open trades`);

  // Delete all non-admin users (cascade handles related records)
  const result = await prisma.user.deleteMany({
    where: { role: { not: 'admin' } },
  });
  console.log(`Deleted ${result.count} non-admin user(s)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
