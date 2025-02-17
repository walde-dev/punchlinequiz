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

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      isAdmin: users.isAdmin,
      onboardingCompleted: users.onboardingCompleted,
      createdAt: users.emailVerified,
      solvedCount: sql<number>`count(${solvedPunchlines.id})`.as("solved_count"),
    })
    .from(users)
    .leftJoin(
      solvedPunchlines,
      sql`${users.id} = ${solvedPunchlines.userId}`
    )
    .groupBy(users.id, users.name, users.email, users.image, users.isAdmin, users.onboardingCompleted, users.emailVerified)
    .orderBy(
      sql`${users.isAdmin} DESC`,
      sql`solved_count DESC`
    );

  return result.map(user => ({
    ...user,
    createdAt: user.createdAt?.getTime() ?? Date.now(),
  }));
} 