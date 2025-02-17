"use server";

import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { users, solvedPunchlines } from "~/server/db/schema";
import { requireAdmin } from "~/server/auth";

export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  createdAt: number;
  solvedCount: number;
};

export async function getUsers() {
  await requireAdmin();

  // Get all users with their solved punchlines count
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      isAdmin: users.isAdmin,
      onboardingCompleted: users.onboardingCompleted,
      createdAt: sql<number>`unixepoch(${users.emailVerified})`.as("created_at"),
      solvedCount: sql<number>`(
        SELECT COUNT(*)
        FROM ${solvedPunchlines}
        WHERE ${solvedPunchlines.userId} = ${users.id}
      )`.as("solved_count"),
    })
    .from(users)
    .orderBy(sql`solved_count DESC`);

  return result;
} 