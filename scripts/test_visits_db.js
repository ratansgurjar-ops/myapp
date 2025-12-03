const { getPool } = require('../lib/db');
(async()=>{
  try{
    const pool = await getPool();
    const [r] = await pool.query('SELECT COUNT(*) as c FROM visits');
    console.log('before', r[0].c);
    await pool.query('INSERT INTO visits (ip,path,user_agent) VALUES (?,?,?)',['8.8.8.8','/test-sim','TestAgent']);
    const [r2] = await pool.query('SELECT COUNT(*) as c FROM visits');
    console.log('after', r2[0].c);
    const [recent] = await pool.query("SELECT COUNT(*) as c FROM visits WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)");
    console.log('last24', recent[0].c);
    process.exit(0);
  } catch(e) {
    console.error('test_visits_db error', e && (e.stack || e.message || e));
    process.exit(1);
  }
})();
