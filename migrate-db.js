const mysql = require('mysql2/promise');
const fs = require('fs');

const SOURCE = {
  host: 'nozomi.proxy.rlwy.net',
  port: 23687,
  user: 'root',
  password: 'hlxjpiTbogxdqysIfPvMotUtdplIhHar',
  database: 'railway',
};

async function dump() {
  console.log('Verbinden met Railway...');
  const conn = await mysql.createConnection(SOURCE);
  console.log('✓ Verbonden!');

  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log(`${tableNames.length} tabellen gevonden`);

  let sql = '';

  for (const table of tableNames) {
    console.log(`Exporteren: ${table}...`);
    const [createTable] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    sql += `\nDROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += `${createTable[0]['Create Table']};\n`;

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const colNames = columns.map(c => `\`${c}\``).join(', ');

    for (const row of rows) {
      const values = columns.map(c => {
        const val = row[c];
        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "\\'")}'`;
      });
      sql += `INSERT INTO \`${table}\` (${colNames}) VALUES (${values.join(', ')});\n`;
    }
    console.log(`  ${rows.length} rijen geëxporteerd`);
  }

  await conn.end();

  const outPath = 'C:\\Users\\NielsVanGortel\\AppData\\Local\\Temp\\alraled-backup.sql';
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`\n✓ Backup opgeslagen: ${outPath}`);
  console.log(`Bestandsgrootte: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
}

dump().catch(err => {
  console.error('Fout:', err.message);
  process.exit(1);
});
