import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../server/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function main() {
  try {
    console.log("Pushing schema to database...");
    await db.run(`DROP TABLE IF EXISTS _drizzle_migrations`);
    
    // Push all tables
    for (const table of Object.values(schema)) {
      if (table.name) {
        await db.run(`DROP TABLE IF EXISTS ${table.name}`);
      }
    }
    
    // Create tables
    const tables = Object.values(schema)
      .filter((table: any) => table.getSQL)
      .map((table: any) => table.getSQL())
      .join(";\n");
    
    await db.run(tables);
    
    console.log("Schema pushed successfully!");
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
  process.exit(0);
}

main(); 