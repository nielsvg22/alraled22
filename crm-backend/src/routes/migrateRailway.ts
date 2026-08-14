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

    // Step 1: Drop all tables (with foreign key checks disabled)
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tableNames) {
      await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Step 2: Create all tables
    for (const table of tableNames) {
      try {
        const [createTable] = await src.query(`SHOW CREATE TABLE \`${table}\``);
        const createSQL = (createTable as any[])[0]['Create Table'];
        await pool.query(createSQL);
      } catch (err: any) {
        results.push({ table, error: `create: ${err.message}` });
      }
    }

    // Step 3: Insert all data
    for (const table of tableNames) {
      try {
        const [rows] = await src.query(`SELECT * FROM \`${table}\``);
        const rowArr = rows as any[];
        if (rowArr.length === 0) {
          results.push({ table, migrated: 0 });
          continue;
        }

        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        const columns = Object.keys(rowArr[0]);
        const colNames = columns.map(c => `\`${c}\``).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`;

        for (const row of rowArr) {
          const values = columns.map(c => row[c]);
          await pool.query(insertSQL, values);
        }
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        results.push({ table, migrated: rowArr.length });
      } catch (err: any) {
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
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
