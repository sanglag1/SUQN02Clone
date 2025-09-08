const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  try {
    const questions = await prisma.question.findMany({ take: 50 });
    let arrays = 0, objects = 0, nulls = 0, others = 0;
    for (const q of questions) {
      const a = q.answers;
      if (Array.isArray(a)) arrays++;
      else if (a === null || a === undefined) nulls++;
      else if (typeof a === 'object') objects++;
      else others++;
    }
    console.log({ arrays, objects, nulls, others, total: questions.length });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
