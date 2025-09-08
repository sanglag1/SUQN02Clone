import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * Export all Prisma models to JSON.
 * - Per-model files: export/<Model>.json
 * - Combined file:   export/_all.json (object keyed by model name)
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/export-all-json.ts
 */
async function main() {
  const outDir = join(process.cwd(), 'export');
  mkdirSync(outDir, { recursive: true });

  // Discover model delegates by introspecting prisma client
  const delegateEntries = Object.entries(prisma)
    .filter(([key, value]) => {
      if (key.startsWith('$')) return false;
      const v: any = value as any;
      return v && typeof v.findMany === 'function';
    }) as Array<[string, any]>;

  if (delegateEntries.length === 0) {
    console.error('No Prisma model delegates found. Did you generate the client?');
    process.exit(1);
  }

  // Convert delegate name (camelCase) to Model name (PascalCase)
  const toModelName = (delegateName: string) =>
    delegateName.charAt(0).toUpperCase() + delegateName.slice(1);

  const combined: Record<string, unknown[]> = {};

  for (const [delegateName, delegate] of delegateEntries) {
    const modelName = toModelName(delegateName);
    process.stdout.write(`Exporting ${modelName}... `);

    const rows: unknown[] = await delegate.findMany();
    combined[modelName] = rows;

    const outPath = join(outDir, `${modelName}.json`);
    writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');
    console.log(`done (${rows.length}) → ${outPath}`);
  }

  const allOutPath = join(outDir, `_all.json`);
  writeFileSync(allOutPath, JSON.stringify(combined, null, 2), 'utf-8');
  console.log(`\nWrote combined export to ${allOutPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


