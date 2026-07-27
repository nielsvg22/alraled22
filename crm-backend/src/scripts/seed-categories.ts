import { db } from '../lib/db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';

const CATEGORIES = [
  { name: 'Bedrijfswagenverlichting', slug: 'bedrijfswagenverlichting', description: 'LED verlichting voor bedrijfswagens, bestelwagens en voertuigen', sortOrder: 0 },
  { name: 'Bouwlichtslangen en toebehoren', slug: 'bouwlichtslangen-en-toebehoren', description: 'Flexibele LED bouwlichtslangen en bijbehorende accessoires', sortOrder: 1 },
  { name: 'LED Hefbrugverlichting', slug: 'hefbrugverlichting', description: 'Professionele LED verlichting voor hefbruggen en werkplaatsen', sortOrder: 2 },
  { name: 'LED Draagbare werkverlichting', slug: 'led-draagbare-werkverlichting', description: 'Portable LED werkverlichting en overige verlichtingsoplossingen', sortOrder: 3 },
  { name: 'Veiligheidsverlichting', slug: 'veiligheidsverlichting', description: 'LED verkeersveiligheid en waarschuwingsverlichting', sortOrder: 4 },
  { name: 'Projectoren', slug: 'projectoren', description: 'Krachtige LED projectoren voor industriële en buiten toepassingen', sortOrder: 5 },
];

async function seedCategories() {
  console.log('Seeding categories...');
  for (const cat of CATEGORIES) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug));
    if (existing.length === 0) {
      await db.insert(categories).values(cat);
      console.log(`  Created: ${cat.name}`);
    } else {
      console.log(`  Already exists: ${cat.name}`);
    }
  }
  console.log('Done!');
  process.exit(0);
}

seedCategories().catch((e) => {
  console.error(e);
  process.exit(1);
});
