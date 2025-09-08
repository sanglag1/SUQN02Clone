import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

type GenericDelegate = {
  findMany: (args?: object) => Promise<unknown[]>;
  deleteMany: (args?: object) => Promise<unknown>;
  createMany: (args: { data: unknown[]; skipDuplicates?: boolean }) => Promise<unknown>;
  create: (args: { data: unknown }) => Promise<unknown>;
};

type RecordsByModel = Record<string, unknown[]>;

/**
 * Import all models from export/_all.json back into the database.
 *
 * Usage:
 *   npx tsx scripts/import-all-json.ts [--reset]
 *
 * Notes:
 * - Uses a fixed insert order matching FK dependencies to avoid constraint errors.
 * - --reset: truncates tables in reverse dependency order before inserting.
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  const dataPath = join(process.cwd(), 'export', '_all.json');
  const jsonText = readFileSync(dataPath, 'utf-8');
  const recordsByModel: RecordsByModel = JSON.parse(jsonText);

  // Model dependency order based on prisma/schema.prisma relations
  const modelInsertOrder = [
    'Role',
    'Permission',
    'RolePermission',
    'JobCategory',
    'JobSpecialization',
    'JobRole',
    'User',
    'UserActivity',
    'ServicePackage',
    'Assessment',
    'Interview',
    'Quiz',
    'Question',
    'UserPackage',
    'PaymentHistory',
    'JdQuestions',
    'JdAnswers',
  ];

  // Correct the order to ensure parents first, children later
  const ordered = modelInsertOrder.filter((m) => recordsByModel[m]);

  if (shouldReset) {
    console.log('Resetting tables...');
    // reverse dependency order for deletion
    const reverse = [...ordered].reverse();
    for (const modelName of reverse) {
      const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const delegate = (prisma as unknown as Record<string, unknown>)[delegateName] as unknown as GenericDelegate;
      if (!delegate) continue;
      process.stdout.write(`- Clearing ${modelName}... `);
      await delegate.deleteMany();
      console.log('done');
    }
  }

  for (const modelName of ordered) {
    const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const delegate = (prisma as unknown as Record<string, unknown>)[delegateName] as unknown as GenericDelegate;
    if (!delegate) continue;

    const rows = (recordsByModel[modelName] ?? []) as unknown[];
    if (rows.length === 0) continue;

    process.stdout.write(`Inserting ${modelName} (${rows.length})... `);
    // Use createMany for speed; skipDuplicates to be resilient
    // Some models may include arrays/Json not supported by createMany defaults; fallback row-by-row
    try {
      await delegate.createMany({ data: rows, skipDuplicates: true });
      console.log('done (createMany)');
    } catch {
      // Fallback to sequential create for models with nested or unsupported types
      for (const row of rows) {
        try {
          await delegate.create({ data: row });
        } catch {
          // If duplicate or constraint error, skip to continue
        }
      }
      console.log('done (row-by-row)');
    }
  }

  console.log('Import completed.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


