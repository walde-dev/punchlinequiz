"use server";

import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { punchlines, solvedPunchlines, users } from "~/server/db/schema";
import { requireAdmin } from "~/server/auth";

export type PunchlineAnalytics = {
  id: number;
  line: string;
  totalSolves: number;
  solvePercentage: number;
  solvedBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
    solvedAt: Date;
    solution: string;
  }[];
};

export async function getPunchlineAnalytics() {
  await requireAdmin();

  // Get total number of users for percentage calculation
  const totalUsers = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .then(result => result[0]?.count ?? 0);

  // Get all punchlines with their solve counts and user details
  const result = await db.query.punchlines.findMany({
    with: {
      solvedBy: {
        with: {
          user: true,
        },
      },
      song: {
        with: {
          artist: true,
        },
      },
    },
  });

  return result.map(punchline => ({
    id: punchline.id,
    line: punchline.line,
    song: {
      name: punchline.song.name,
      artist: punchline.song.artist.name,
    },
    totalSolves: punchline.solvedBy.length,
    solvePercentage: totalUsers > 0 ? (punchline.solvedBy.length / totalUsers) * 100 : 0,
    solvedBy: punchline.solvedBy.map(solve => ({
      id: solve.user.id,
      name: solve.user.name,
      email: solve.user.email,
      image: solve.user.image,
      isAdmin: solve.user.isAdmin ?? false,
      solvedAt: new Date(solve.solvedAt), // Just create a new Date from the timestamp
      solution: solve.solution,
    })),
  }));
}

export async function getOverallStats() {
  await requireAdmin();

  const totalUsers = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .then(result => result[0]?.count ?? 0);

  const totalPunchlines = await db.select({ count: sql<number>`count(*)` })
    .from(punchlines)
    .then(result => result[0]?.count ?? 0);

  const totalSolves = await db.select({ count: sql<number>`count(*)` })
    .from(solvedPunchlines)
    .then(result => result[0]?.count ?? 0);

  const averageSolvesPerUser = totalUsers > 0 ? totalSolves / totalUsers : 0;
  const averageSolvesPerPunchline = totalPunchlines > 0 ? totalSolves / totalPunchlines : 0;

  return {
    totalUsers,
    totalPunchlines,
    totalSolves,
    averageSolvesPerUser,
    averageSolvesPerPunchline,
  };
} 