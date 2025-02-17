import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { anonymousSessions } from "~/server/db/schema";

export async function getOrCreateAnonymousSession(fingerprint: string) {
  // Try to find an existing session
  const existingSession = await db.query.anonymousSessions.findFirst({
    where: sql`${anonymousSessions.fingerprint} = ${fingerprint}`,
  });

  if (existingSession) {
    return existingSession;
  }

  // Create a new session if none exists
  const [newSession] = await db
    .insert(anonymousSessions)
    .values({
      fingerprint,
      totalPlays: 0,
      correctGuesses: 0,
      createdAt: new Date(),
    })
    .returning();

  return newSession;
} 