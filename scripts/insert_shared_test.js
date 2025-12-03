const { getPool } = require('../lib/db');

async function run() {
  try {
    const pool = await getPool();
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
    const now = new Date();
    const savedAt = now.toISOString().slice(0,19).replace('T',' ');
    await pool.query('INSERT INTO typing_shared (id, title, text, category, visible, savedAt) VALUES (?, ?, ?, ?, ?, ?)', [id, 'Admin test', 'This is a test from admin script', 'practice', 1, savedAt]);
    console.log('inserted id', id);
    process.exit(0);
  } catch (e) {
    console.error('insert error', e && (e.stack || e.message || e));
    process.exit(2);
  }
}
run();
