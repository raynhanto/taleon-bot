// src/db.js — shared PostgreSQL connection for all bot features.
// Import this wherever you need database access.

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Railway Postgres
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id   TEXT NOT NULL,
      guild_id  TEXT NOT NULL,
      xp        INTEGER      DEFAULT 0,
      level     INTEGER      DEFAULT 1,
      last_xp_at TIMESTAMPTZ DEFAULT NULL,
      joined_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, guild_id)
    );
    CREATE TABLE IF NOT EXISTS bot_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export async function getSetting(key) {
  const res = await pool.query('SELECT value FROM bot_settings WHERE key = $1', [key]);
  return res.rows[0]?.value ?? null;
}

export async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO bot_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, String(value)]
  );
}

export async function getUser(userId, guildId) {
  const res = await pool.query(
    'SELECT * FROM users WHERE user_id = $1 AND guild_id = $2',
    [userId, guildId]
  );
  return res.rows[0] ?? null;
}

export async function upsertUser(userId, guildId, { xp, level, lastXpAt }) {
  await pool.query(
    `INSERT INTO users (user_id, guild_id, xp, level, last_xp_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, guild_id) DO UPDATE
     SET xp = $3, level = $4, last_xp_at = $5`,
    [userId, guildId, xp, level, lastXpAt]
  );
}

export default pool;
