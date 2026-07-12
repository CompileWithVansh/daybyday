import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const vanshPassword = await bcrypt.hash('hugmemore', 10);
  const pakhiPassword = await bcrypt.hash('kissmemore', 10);

  const vansh = await prisma.user.upsert({
    where: { email: 'vansh@gmail.com' },
    update: {},
    create: {
      username: 'vansh',
      email: 'vansh@gmail.com',
      password: vanshPassword,
      displayName: 'Vansh',
    },
  });

  const pakhi = await prisma.user.upsert({
    where: { email: 'lipika@gmail.com' },
    update: {},
    create: {
      username: 'pakhi',
      email: 'lipika@gmail.com',
      password: pakhiPassword,
      displayName: 'Pakhi',
    },
  });

  console.log('Seeded users:', { vansh, pakhi });
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
