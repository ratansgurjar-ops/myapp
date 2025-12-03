const { getPool } = require('../lib/db');

async function run() {
  const username = 'RSGurjar';
  const text = 'test from script';
  const title = 'Script save';
  const displayName = 'Ratan';
  try {
    const pool = await getPool();
    const now = new Date();
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
    const createdAt = now.toISOString().slice(0,19).replace('T', ' ');
    console.log('Inserting id', id);
    await pool.query('INSERT INTO typing_user_exercises (id, username, title, text, createdAt) VALUES (?, ?, ?, ?, ?)', [id, username, title || '', text || '', createdAt]);
    console.log('Inserted');
    const [countRows] = await pool.query('SELECT COUNT(*) as c FROM typing_user_exercises WHERE username = ?', [username]);
    console.log('countRows', countRows);
    const count = (countRows && countRows[0] && countRows[0].c) ? Number(countRows[0].c) : 0;
    console.log('count', count);
    if (count > 2) {
      const toRemove = count - 2;
      const [oldRows] = await pool.query('SELECT id FROM typing_user_exercises WHERE username = ? ORDER BY createdAt ASC LIMIT ?', [username, toRemove]);
      const ids = oldRows.map(r => r.id).filter(Boolean);
      console.log('old ids', ids);
      if (ids.length) {
        await pool.query(`DELETE FROM typing_user_exercises WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
        console.log('deleted old rows');
      }
    }
    const [countRows2] = await pool.query('SELECT COUNT(*) as c FROM typing_user_exercises WHERE username = ?', [username]);
    const finalCount = (countRows2 && countRows2[0] && countRows2[0].c) ? Number(countRows2[0].c) : 0;
    console.log('finalCount', finalCount);
    await pool.query(`INSERT INTO typing_users (username, displayName, lastSaved, exerciseCount) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE displayName = VALUES(displayName), lastSaved = VALUES(lastSaved), exerciseCount = VALUES(exerciseCount)
    `, [username, displayName || '', createdAt, finalCount]);
    console.log('upsert user done');
    process.exit(0);
  } catch (e) {
    console.error('script error', e && (e.stack || e.message || e));
    process.exit(2);
  }
}

run();
