const mysql = require('mysql2/promise');

const SOURCE = {
  host: process.env.SOURCE_HOST,
  port: Number(process.env.SOURCE_PORT),
  user: process.env.SOURCE_USER,
  password: process.env.SOURCE_PASSWORD,
  database: process.env.SOURCE_DATABASE,
  connectTimeout: 10000,
  ssl: process.env.SOURCE_SSL === 'false' ? undefined : {},
};

const TARGET = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: process.env.MYSQL_SSL === 'false' ? undefined : { rejectUnauthorized: false },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

migrate()
  .catch(err => {
    console.error('FOUT:', err.message);
  })
  .finally(async () => {
    console.log('\nContainer blijft 5 minuten hangen zodat de logs uitgelezen kunnen worden...');
    await sleep(5 * 60 * 1000);
    process.exit(0);
  });
