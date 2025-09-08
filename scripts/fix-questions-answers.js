const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔧 Normalizing Question.answers to array format...');
    const questions = await prisma.question.findMany();
    let updated = 0;

    for (const q of questions) {
      const ans = q.answers;
      // If answers is already an array, skip
      if (Array.isArray(ans)) continue;

      if (ans && typeof ans === 'object') {
        // Detect possible correct answer hint stored in explanation or missing; best-effort: mark all as not correct
        // If there is a known property correctAnswer in the stored object, use it
        const possibleCorrect = ans.correctAnswer || ans.correct || ans._correct;
        // Build array from key-value pairs where value is string
        const entries = Object.entries(ans).filter(([k, v]) => typeof v === 'string');
        if (entries.length === 0) continue;

        const answersArray = entries.map(([key, value]) => ({
          content: value,
          isCorrect: typeof possibleCorrect === 'string' ? key.toUpperCase() === String(possibleCorrect).toUpperCase() : false,
        }));

        await prisma.question.update({
          where: { id: q.id },
          data: { answers: answersArray },
        });
        updated += 1;
      }
    }

    console.log(`✅ Done. Updated ${updated} questions.`);
  } catch (error) {
    console.error('❌ Error fixing questions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
