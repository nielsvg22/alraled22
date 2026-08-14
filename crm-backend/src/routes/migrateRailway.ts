import { Router } from 'express';
import { pool } from '../lib/db';
import { createConnection } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const src = await createConnection({
      host: 'nozomi.proxy.rlwy.net',
      port: 23687,
      user: 'root',
      password: 'hlxjpiTbogxdqysIfPvMotUtdplIhHar',
      database: 'railway',
    });

    const [tables] = await src.query('SHOW TABLES');
    const tableNames: string[] = (tables as any[]).map((t: any) => Object.values(t)[0] as string);
    const results: any[] = [];

    for (const table of tableNames) {
      try {
        const [createTable] = await src.query(`SHOW CREATE TABLE \`${table}\``);
        const createSQL = (createTable as any[])[0]['Create Table'];
        await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
        await pool.query(createSQL);

        const [rows] = await src.query(`SELECT * FROM \`${table}\``);
        const rowArr = rows as any[];
        if (rowArr.length === 0) {
          results.push({ table, migrated: 0 });
          continue;
        }

        const columns = Object.keys(rowArr[0]);
        const colNames = columns.map(c => `\`${c}\``).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`;

        for (const row of rowArr) {
          const values = columns.map(c => row[c]);
          await pool.query(insertSQL, values);
        }
        results.push({ table, migrated: rowArr.length });
      } catch (err: any) {
        results.push({ table, error: err.message });
      }
    }

    await src.end();
    res.json({ success: true, tables: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
