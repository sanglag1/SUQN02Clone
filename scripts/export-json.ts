import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * Usage:
 *  - ts-node --transpile-only scripts/export-json.ts <ModelName>
 *  - node dist/scripts/export-json.js <ModelName>
 *
 * Example:
 *  - ts-node --transpile-only scripts/export-json.ts User
 */
async function main() {
  const modelNameArg = process.argv[2] || process.env.MODEL;
  if (!modelNameArg) {
    console.error('Missing model name. Usage: ts-node scripts/export-json.ts <ModelName>');
    process.exit(1);
  }

  // Prisma Client delegates are camelCase model names with a lowercase first letter
  const delegateName = modelNameArg.charAt(0).toLowerCase() + modelNameArg.slice(1);

  const delegate = (prisma as any)[delegateName];
  if (!delegate || typeof delegate.findMany !== 'function') {
    console.error(`Model delegate not found for "${modelNameArg}" (tried prisma.${delegateName}).`);
    process.exit(1);
  }

  console.log(`Exporting all records of model ${modelNameArg}...`);

  const records = await delegate.findMany();

  const outDir = join(process.cwd(), 'export');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${modelNameArg}.json`);

  writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf-8');
  console.log(`Exported ${records.length} records to ${outPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


