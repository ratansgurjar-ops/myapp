const { getPool } = require('../lib/db');

async function run() {
  try {
    const pool = await getPool();
    const [r1] = await pool.query('SELECT COUNT(*) as c FROM typing_user_exercises');
    const [r2] = await pool.query('SELECT COUNT(*) as c FROM typing_users');
    console.log('typing_user_exercises count =', (r1 && r1[0] && r1[0].c) || 0);
    console.log('typing_users count =', (r2 && r2[0] && r2[0].c) || 0);
    process.exit(0);
  } catch (e) {
    console.error('test error', e && (e.stack || e.message || e));
    process.exit(2);
  }
}
run();
