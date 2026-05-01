// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.NEON_DB_HOST,
  port: parseInt(process.env.NEON_DB_PORT || '5432'),
  database: process.env.NEON_DB_NAME,
  user: process.env.NEON_DB_USER,
  password: process.env.NEON_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export default pool;
