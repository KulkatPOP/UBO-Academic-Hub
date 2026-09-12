import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeDatabasePool, databasePool } from "../config/database.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const seedsDirectory = join(currentDirectory, "seeds");

async function run() {
  const files = (await readdir(seedsDirectory)).filter(file => file.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(join(seedsDirectory, file), "utf8");
    await databasePool.query(sql);
    console.info(`Applied seed: ${file}`);
  }
}

run().catch(error => {
  console.error("Database seed failed:", error.message);
  process.exitCode = 1;
}).finally(closeDatabasePool);
