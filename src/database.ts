import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function initDb() {
  const createExtensionQuery = `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tickets ( 
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vatin VARCHAR(11) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `; 
  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_ticket_vatin ON tickets (vatin);
  `;
  try {
    await pool.query(createExtensionQuery);
    await pool.query(createTableQuery);
    await pool.query(createIndexQuery);
  } catch (err) {
    console.error('Došlo je do greške pri kreiranju tablice ili indeksa:', err);
  }
}

initDb();

export default pool;
