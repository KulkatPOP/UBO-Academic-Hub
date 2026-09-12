import pg from "pg";

const { Pool } = pg;

function databaseConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432", 10) || 5432,
    database: process.env.DB_NAME || "ubo_academic_hub",
    user: process.env.DB_USER || "ubo_admin",
    password: process.env.DB_PASSWORD || "ubo_password_demo",
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 3_000
  };
}

export const databasePool = new Pool(databaseConfig());

export async function checkDatabaseConnection() {
  await databasePool.query("SELECT 1 AS connected");
  return { database: "connected" };
}

export async function closeDatabasePool() {
  await databasePool.end();
}
