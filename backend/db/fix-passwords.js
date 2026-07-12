const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_0sbrftpx1wAP@ep-morning-resonance-ao9i4jiq.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

const hash = '$2b$10$0WeLNA3FdmglGAf3ti2Sl.gJTrkoBAjg1PZCARRLxxoHcRt0f/hNi';

pool.query('UPDATE users SET password_hash = $1', [hash])
  .then((r) => { console.log('Updated', r.rowCount, 'users'); return pool.end(); })
  .catch((e) => { console.error(e); pool.end(); });
