const { Pool } = require('pg');
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });
for (const name of ['DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
  if (typeof process.env[name] !== 'string' || process.env[name].length === 0) {
    throw new Error(`${name} is required for controlled reference use`);
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
