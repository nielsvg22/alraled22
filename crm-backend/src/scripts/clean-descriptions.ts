import { db, pool } from '../lib/db';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sanitizeDescription, hasHtml } from '../lib/htmlText';

// Gebruik: npm run db:clean-descriptions          (alleen tonen wat er verandert)
//          npm run db:clean-descriptions -- --apply  (wijzigingen opslaan)
async function cleanDescriptions() {
  const apply = process.argv.includes('--apply');
  const rows = await db.select({ id: products.id, name: products.name, description: products.description }).from(products);

  let changed = 0;
  for (const row of rows) {
    if (!row.description || !hasHtml(row.description)) continue;
    const cleaned = sanitizeDescription(row.description);
    if (cleaned === row.description) continue;
    changed++;
    console.log(`${apply ? 'Fixed' : 'Would fix'}: ${row.name}`);
    if (apply) await db.update(products).set({ description: cleaned || null }).where(eq(products.id, row.id));
  }

  console.log(`${changed} van ${rows.length} producten ${apply ? 'opgeschoond' : 'bevatten HTML (draai met --apply om op te slaan)'}.`);
  await pool.end();
}

cleanDescriptions().catch((e) => {
  console.error(e);
  process.exit(1);
});
