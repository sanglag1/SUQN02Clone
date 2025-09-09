/*
  Seed sample QuestionItem data for the new Question Bank (admin management).
  - Includes skills and difficulty fields
  - Covers single_choice and multiple_choice

  Run:
    npx tsx scripts/seed-questions.ts
*/
import { PrismaClient, QuizLevel } from "@prisma/client";

const prisma = new PrismaClient();

type Choice = { text: string; correct?: boolean };

async function createQuestion(
  type: "single_choice" | "multiple_choice" | "free_text" | "scale" | "coding",
  stem: string,
  level: QuizLevel | null,
  topics: string[],
  fields: string[],
  skills: string[],
  difficulty: number | null,
  explanation: string | null,
  choices?: Choice[]
) {
  return prisma.questionItem.create({
    data: {
      type,
      stem,
      explanation,
      level: level ?? undefined,
      topics,
      fields,
      skills,
      difficulty: difficulty ?? undefined,
      options: choices?.length
        ? {
            createMany: {
              data: choices.map((c, idx) => ({ text: c.text, isCorrect: !!c.correct, order: idx })),
            },
          }
        : undefined,
    },
  });
}

async function main() {
  const data: Array<Parameters<typeof createQuestion>> = [
    [
      "single_choice",
      "HTTP status 404 có ý nghĩa gì?",
      QuizLevel.junior,
      ["HTTP"],
      ["Backend"],
      ["HTTP", "Web"],
      0.2,
      "404 Not Found: tài nguyên không tồn tại.",
      [
        { text: "OK" },
        { text: "Not Found", correct: true },
        { text: "Created" },
        { text: "Bad Request" },
      ],
    ],
    [
      "single_choice",
      "SQL lệnh nào để lấy tất cả cột từ bảng users?",
      QuizLevel.junior,
      ["SQL"],
      ["Database"],
      ["SQL"],
      0.2,
      "SELECT * FROM users;",
      [
        { text: "GET ALL users" },
        { text: "SELECT * FROM users", correct: true },
        { text: "FETCH users" },
      ],
    ],
    [
      "multiple_choice",
      "Những item nào là framework JavaScript front-end?",
      QuizLevel.middle,
      ["Frontend"],
      ["Web"],
      ["Frontend", "JS"],
      0.5,
      "React và Vue là framework/bibli JS phổ biến.",
      [
        { text: "React", correct: true },
        { text: "Vue", correct: true },
        { text: "Node.js" },
        { text: "Express" },
      ],
    ],
    [
      "single_choice",
      "Status code nào đại diện cho 'Created'?",
      QuizLevel.junior,
      ["HTTP"],
      ["Backend"],
      ["HTTP"],
      0.3,
      "201 Created.",
      [
        { text: "200" },
        { text: "201", correct: true },
        { text: "204" },
      ],
    ],
    [
      "single_choice",
      "Mệnh đề nào để lọc trong SQL?",
      QuizLevel.junior,
      ["SQL"],
      ["Database"],
      ["SQL"],
      0.3,
      "WHERE dùng để lọc hàng theo điều kiện.",
      [
        { text: "ORDER BY" },
        { text: "WHERE", correct: true },
        { text: "GROUP BY" },
      ],
    ],
  ];

  for (const q of data) {
    // TS trick to spread tuple params
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await createQuestion(...q);
  }

  console.log("Seeded", data.length, "QuestionItem records.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


