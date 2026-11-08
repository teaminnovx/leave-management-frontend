import fs from "node:fs";
import path from "node:path";
import { createSeed } from "./seed";
import type { Database } from "./types";

/**
 * Repository layer. A JSON file keeps the workshop setup to `npm install`;
 * replacing this module is all it takes to move to a real database.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function persist(db: Database) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryFile = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(db, null, 2));
  fs.renameSync(temporaryFile, DB_FILE);
}

function load(): Database {
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeed();
    persist(seed);
    return seed;
  }
  return { audit: [], notifications: [], ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
}

export function read<T>(query: (db: Readonly<Database>) => T): T {
  return query(load());
}

/** Runs synchronously and only saves if `work` returns, so a thrown error changes nothing. */
export function transaction<T>(work: (db: Database) => T): T {
  const db = load();
  const result = work(db);
  persist(db);
  return result;
}
