import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || "";
const isLocalDb = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

// Solo activa SSL en producción cuando NO nos conectamos a una BD local
const isProduction = process.env.NODE_ENV === "production" && !isLocalDb;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;