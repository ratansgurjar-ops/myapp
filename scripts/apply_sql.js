const fs = require('fs');
const path = require('path');
const { getPool } = require('../lib/db');

async function run() {
  try {
    const sqlPath = path.join(process.cwd(), 'sql', 'typing_tables.sql');
    const raw = await fs.promises.readFile(sqlPath, 'utf8');
    // naive split on semicolon; keep it simple and filter empty statements
    const stmts = raw.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    const pool = await getPool();
    for (const s of stmts) {
      try {
        await pool.query(s);
      } catch (e) {
        console.warn('Statement failed (continuing):', e.message || e);
      }
    }
    console.log('SQL applied (attempted all statements).');
    process.exit(0);
  } catch (e) {
    console.error('Error applying SQL:', e && (e.stack || e.message || e));
    process.exit(2);
  }
}

run();
