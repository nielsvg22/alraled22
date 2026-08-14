const mysql = require('mysql2/promise');

const SOURCE = {
  host: 'roundhouse.proxy.rlwy.net',
  port: 17063,
  user: 'root',
  password: 'hlxjpiTbogxdqysIfPvMotUtdplIhHar',
  database: 'railway',
  connectTimeout: 10000,
  ssl: {},
};

async function test() {
  try {
    console.log('Verbinden...');
    const conn = await mysql.createConnection(SOURCE);
    console.log('Verbonden!');
    const [rows] = await conn.query('SHOW TABLES');
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error('Fout:', err.code, err.message);
  }
}

test();
