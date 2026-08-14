import { Router } from 'express';
import mysql from 'mysql2/promise';
import { pool } from '../lib/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const source = await mysql.createConnection({
      host: 'nozomi.proxy.rlwy.net',
      port: 23687,
      user: 'root',
      password: 'hlxjpiTbogxdqysIfPvMotUtdplIhHar',
      database: 'railway',
    });

    const [tables] = await source.query('SHOW TABLES');
    const tableNames = tables.map((t: any) => Object.values(t)[0]);
    const results: any[] = [];

    for (const table of tableNames) {
      try {
        const [createTable] = await source.query(`SHOW CREATE TABLE \`${table}\``);
        const createSQL = createTable[0]['Create Table'];
        await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
        await pool.query(createSQL);

        const [rows] = await source.query(`SELECT * FROM \`${table}\``);
        if (rows.length === 0) {
          results.push({ table, migrated: 0 });
          continue;
        }

        const columns = Object.keys(rows[0]);
        const colNames = columns.map(c => `\`${c}\``).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = columns.map(c => (row as any)[c]);
          await pool.query(insertSQL, values);
        }
        results.push({ table, migrated: rows.length });
      } catch (err: any) {
        results.push({ table, error: err.message });
      }
    }

    await source.end();
    res.json({ success: true, tables: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
