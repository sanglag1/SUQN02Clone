/*
  Seed sample data for the new Question Bank models:
  - QuestionItem + QuestionOption
  - QuestionSet + QuestionSetQuestion
  - QuizTemplate

  Run:
    npx tsx scripts/seed-question-bank.ts
*/
import { PrismaClient, QuizLevel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Optional: try to link to an existing JobRole if any
  const anyRole = await prisma.jobRole.findFirst({ select: { id: true } });

  // Create sample questions
  const q1 = await prisma.questionItem.create({
    data: {
      type: "single_choice",
      stem: "HTTP status 200 có ý nghĩa gì?",
      explanation: "200 OK nghĩa là yêu cầu thành công.",
      level: QuizLevel.junior,
      topics: ["HTTP"],
      fields: ["Backend"],
      options: {
        createMany: {
          data: [
            { text: "OK", isCorrect: true, order: 0 },
            { text: "Created", isCorrect: false, order: 1 },
            { text: "Accepted", isCorrect: false, order: 2 },
          ],
        },
      },
    },
    include: { options: true },
  });

  const q2 = await prisma.questionItem.create({
    data: {
      type: "single_choice",
      stem: "SQL JOIN nào trả về tất cả bản ghi từ cả hai bảng, khớp nếu có?",
      explanation: "FULL OUTER JOIN.",
      level: QuizLevel.middle,
      topics: ["SQL"],
      fields: ["Database"],
      options: {
        createMany: {
          data: [
            { text: "INNER JOIN", isCorrect: false, order: 0 },
            { text: "LEFT JOIN", isCorrect: false, order: 1 },
            { text: "RIGHT JOIN", isCorrect: false, order: 2 },
            { text: "FULL OUTER JOIN", isCorrect: true, order: 3 },
          ],
        },
      },
    },
    include: { options: true },
  });

  const q3 = await prisma.questionItem.create({
    data: {
      type: "multiple_choice",
      stem: "Những lựa chọn nào là ngôn ngữ lập trình?",
      explanation: "JavaScript và Python là ngôn ngữ lập trình.",
      level: QuizLevel.junior,
      topics: ["Basic"],
      fields: ["General"],
      options: {
        createMany: {
          data: [
            { text: "JavaScript", isCorrect: true, order: 0 },
            { text: "HTML", isCorrect: false, order: 1 },
            { text: "CSS", isCorrect: false, order: 2 },
            { text: "Python", isCorrect: true, order: 3 },
          ],
        },
      },
    },
    include: { options: true },
  });

  // Create a Question Set and link questions
  const set = await prisma.questionSet.create({
    data: {
      name: "Sample Backend Set",
      description: "Bộ câu hỏi mẫu cho Backend",
      jobRoleId: anyRole?.id ?? null,
      level: QuizLevel.junior,
      topics: ["HTTP", "SQL"],
      fields: ["Backend", "Database"],
      status: "published",
      version: 1,
    },
  });

  await prisma.questionSetQuestion.createMany({
    data: [
      { questionSetId: set.id, questionId: q1.id, order: 0, section: "HTTP", weight: 1, isRequired: true },
      { questionSetId: set.id, questionId: q2.id, order: 1, section: "SQL", weight: 1, isRequired: true },
      { questionSetId: set.id, questionId: q3.id, order: 2, section: "General", weight: 1, isRequired: true },
    ],
    skipDuplicates: true,
  });

  // Create a Quiz Template from the set
  const template = await prisma.quizTemplate.create({
    data: {
      questionSetId: set.id,
      name: "Backend Junior Template",
      description: "Template mặc định cho Backend Junior",
      timeLimit: 900, // 15 phút
      shuffle: true,
      sectionRules: {
        HTTP: { take: 1 },
        SQL: { take: 1 },
        General: { take: 1 },
      },
      scoringPolicy: { correct: 1, wrong: 0 },
      retakePolicy: { maxAttempts: 3, cooldownMinutes: 60 },
      isActive: true,
    },
  });

  console.log("Seeded:", {
    questionItems: [q1.id, q2.id, q3.id],
    questionSet: set.id,
    quizTemplate: template.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



