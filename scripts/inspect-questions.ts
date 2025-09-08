import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    select: { fields: true, topics: true, levels: true },
    take: 5000,
  });

  const fieldSet = new Set<string>();
  const topicSet = new Set<string>();
  const levelSet = new Set<string>();

  for (const q of questions) {
    (q.fields || []).forEach((f) => f && fieldSet.add(String(f)));
    (q.topics || []).forEach((t) => t && topicSet.add(String(t)));
    (q.levels || []).forEach((l) => l && levelSet.add(String(l)));
  }

  console.log('Distinct fields (category names):');
  console.log(Array.from(fieldSet).sort());
  console.log('\nDistinct topics (skills):');
  console.log(Array.from(topicSet).sort());
  console.log('\nDistinct levels:');
  console.log(Array.from(levelSet).sort());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



