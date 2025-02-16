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
    
    // Get all table names
    const tableNames = [
      "punchlinequiz_artist",
      "punchlinequiz_album",
      "punchlinequiz_song",
      "punchlinequiz_punchline",
      "punchlinequiz_post",
      "punchlinequiz_user",
      "punchlinequiz_account",
      "punchlinequiz_session",
      "punchlinequiz_verification_token",
    ];
    
    // Drop existing tables
    for (const tableName of tableNames) {
      await db.run(`DROP TABLE IF EXISTS ${tableName}`);
    }
    
    // Create tables using schema SQL
    const schemaSQL = `
      CREATE TABLE IF NOT EXISTS punchlinequiz_artist (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT,
        spotify_url TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_album (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT,
        release_date TEXT,
        spotify_url TEXT,
        artist_id TEXT NOT NULL REFERENCES punchlinequiz_artist(id),
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_song (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        spotify_url TEXT,
        album_id TEXT NOT NULL REFERENCES punchlinequiz_album(id),
        artist_id TEXT NOT NULL REFERENCES punchlinequiz_artist(id),
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_user (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL,
        email_verified INTEGER DEFAULT (unixepoch()),
        image TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        onboarding_completed INTEGER NOT NULL DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_punchline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line TEXT NOT NULL,
        perfect_solution TEXT NOT NULL,
        acceptable_solutions TEXT NOT NULL,
        song_id TEXT NOT NULL REFERENCES punchlinequiz_song(id),
        created_by TEXT NOT NULL REFERENCES punchlinequiz_user(id),
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_post (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        created_by TEXT NOT NULL REFERENCES punchlinequiz_user(id),
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_account (
        user_id TEXT NOT NULL REFERENCES punchlinequiz_user(id),
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, provider_account_id)
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_session (
        session_token TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES punchlinequiz_user(id),
        expires INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS punchlinequiz_verification_token (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires INTEGER NOT NULL,
        PRIMARY KEY (identifier, token)
      );
      
      CREATE INDEX IF NOT EXISTS artist_name_idx ON punchlinequiz_artist(name);
      CREATE INDEX IF NOT EXISTS album_name_idx ON punchlinequiz_album(name);
      CREATE INDEX IF NOT EXISTS album_artist_idx ON punchlinequiz_album(artist_id);
      CREATE INDEX IF NOT EXISTS song_name_idx ON punchlinequiz_song(name);
      CREATE INDEX IF NOT EXISTS song_album_idx ON punchlinequiz_song(album_id);
      CREATE INDEX IF NOT EXISTS song_artist_idx ON punchlinequiz_song(artist_id);
      CREATE INDEX IF NOT EXISTS punchline_created_by_idx ON punchlinequiz_punchline(created_by);
      CREATE INDEX IF NOT EXISTS punchline_song_idx ON punchlinequiz_punchline(song_id);
      CREATE INDEX IF NOT EXISTS created_by_idx ON punchlinequiz_post(created_by);
      CREATE INDEX IF NOT EXISTS name_idx ON punchlinequiz_post(name);
      CREATE INDEX IF NOT EXISTS account_user_id_idx ON punchlinequiz_account(user_id);
      CREATE INDEX IF NOT EXISTS session_userId_idx ON punchlinequiz_session(userId);
    `;
    
    await db.run(schemaSQL);
    
    console.log("Schema pushed successfully!");
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
  process.exit(0);
}

main(); 