const mysql = require('mysql2/promise');

const SOURCE = {
  host: 'nozomi.proxy.rlwy.net',
  port: 23687,
  user: 'root',
  password: 'hlxjpiTbogxdqysIfPvMotUtdplIhHar',
  database: 'railway',
};

// Northflank addon connection via env vars
const TARGET = {
  host: process.env.MYSQL_HOST || 'primary.alraled-mysql--8n7zm5bdjx8d.addon.code.run',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'a596b9ca0173e9c6',
  password: process.env.MYSQL_PASSWORD || '183972f03cd9d8460dec142ca06fbf',
  database: process.env.MYSQL_DATABASE || '252638c8748b',
  ssl: { rejectUnauthorized: true },
};

async function migrate() {
  console.log('Verbinden met Railway...');
  const source = await mysql.createConnection(SOURCE);
  console.log('✓ Verbonden met Railway');

  console.log('Verbinden met Northflank...');
  const target = await mysql.createConnection(TARGET);
  console.log('✓ Verbonden met Northflank');

  const [tables] = await source.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log(`\n${tableNames.length} tabellen gevonden`);

  for (const table of tableNames) {
    console.log(`\nMigreren: ${table}...`);
    try {
      const [createTable] = await source.query(`SHOW CREATE TABLE \`${table}\``);
      const createSQL = createTable[0]['Create Table'];
      await target.query(`DROP TABLE IF EXISTS \`${table}\``);
      await target.query(createSQL);

      const [rows] = await source.query(`SELECT * FROM \`${table}\``);
      if (rows.length === 0) {
        console.log(`  Geen data`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `\`${c}\``).join(', ');
      const placeholders = columns.map(() => '?').join(', ');
      const insertSQL = `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`;

      let migrated = 0;
      for (const row of rows) {
        const values = columns.map(c => row[c]);
        await target.query(insertSQL, values);
        migrated++;
      }
      console.log(`  ✓ ${migrated} rijen`);
    } catch (err) {
      console.log(`  ✗ Fout: ${err.message}`);
    }
  }

  await source.end();
  await target.end();
  console.log('\n✓ Migratie voltooid!');
}

migrate().catch(err => {
  console.error('FOUT:', err.message);
  process.exit(1);
});
