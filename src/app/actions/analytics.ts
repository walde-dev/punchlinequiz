"use server";

import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { punchlines, solvedPunchlines, users, anonymousSessions, anonymousActivity } from "~/server/db/schema";
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

export type TimeSpan = "1h" | "24h" | "7d";

export async function getOverallStats(timeSpan: TimeSpan = "24h") {
  await requireAdmin();

  const now = new Date();
  let compareDate: Date;
  switch (timeSpan) {
    case "1h":
      compareDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      compareDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      compareDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  // Current period stats
  const [currentUsers, currentPunchlines, currentSolves] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(punchlines),
    db.select({ count: sql<number>`count(*)` }).from(solvedPunchlines),
  ]);

  // Previous period stats
  const [prevUsers, prevPunchlines, prevSolves] = await Promise.all([
    db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(users)
    .where(sql`${users.emailVerified} < ${compareDate.getTime() / 1000}`),
    db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(punchlines)
    .where(sql`${punchlines.createdAt} < ${compareDate.getTime() / 1000}`),
    db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(solvedPunchlines)
    .where(sql`${solvedPunchlines.solvedAt} < ${compareDate.getTime() / 1000}`),
  ]);

  const totalUsers = currentUsers[0]?.count ?? 0;
  const totalPunchlines = currentPunchlines[0]?.count ?? 0;
  const totalSolves = currentSolves[0]?.count ?? 0;

  const prevTotalUsers = prevUsers[0]?.count ?? 0;
  const prevTotalPunchlines = prevPunchlines[0]?.count ?? 0;
  const prevTotalSolves = prevSolves[0]?.count ?? 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalUsers,
    totalPunchlines,
    totalSolves,
    averageSolvesPerUser: totalUsers > 0 ? totalSolves / totalUsers : 0,
    averageSolvesPerPunchline: totalPunchlines > 0 ? totalSolves / totalPunchlines : 0,
    changes: {
      users: calculateChange(totalUsers, prevTotalUsers),
      punchlines: calculateChange(totalPunchlines, prevTotalPunchlines),
      solves: calculateChange(totalSolves, prevTotalSolves),
      average: calculateChange(
        totalUsers > 0 ? totalSolves / totalUsers : 0,
        prevTotalUsers > 0 ? prevTotalSolves / prevTotalUsers : 0
      ),
    },
  };
}

export type AnonymousStats = {
  totalSessions: number;
  activeSessions: number;
  conversionRate: number;
  totalPlays: number;
  averagePlaysPerSession: number;
  correctGuessRate: number;
  recentActivity: {
    id: string;
    fingerprint: string;
    lastSeenAt: Date;
    totalPlays: number;
    correctGuesses: number;
    activities: {
      type: string;
      guess?: string;
      timestamp: Date;
      punchline?: {
        line: string;
      };
    }[];
  }[];
};

export async function getAnonymousStats(timeSpan: TimeSpan = "24h") {
  await requireAdmin();

  const now = new Date();
  let compareDate: Date;
  switch (timeSpan) {
    case "1h":
      compareDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      compareDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      compareDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  // Get total sessions and active sessions
  const [totalSessions, activeSessions] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(anonymousSessions),
    db.select({ count: sql<number>`count(*)` })
      .from(anonymousSessions)
      .where(sql`${anonymousSessions.lastSeenAt} >= ${compareDate.getTime() / 1000}`),
  ]);

  // Get conversion stats
  const conversions = await db.select({ count: sql<number>`count(*)` })
    .from(anonymousSessions)
    .where(sql`${anonymousSessions.convertedToUser} is not null`);

  // Get total plays and correct guesses
  const [totalPlays, correctGuesses] = await Promise.all([
    db.select({ sum: sql<number>`sum(${anonymousSessions.totalPlays})` }).from(anonymousSessions),
    db.select({ sum: sql<number>`sum(${anonymousSessions.correctGuesses})` }).from(anonymousSessions),
  ]);

  // Get recent activity
  const recentActivity = await db.query.anonymousSessions.findMany({
    where: sql`${anonymousSessions.lastSeenAt} >= ${compareDate.getTime() / 1000}`,
    with: {
      activities: {
        where: sql`${anonymousActivity.timestamp} >= ${compareDate.getTime() / 1000}`,
        with: {
          punchline: true,
        },
        limit: 10,
      },
    },
    orderBy: sql`${anonymousSessions.lastSeenAt} DESC`,
    limit: 10,
  });

  const total = totalSessions[0]?.count ?? 0;
  const active = activeSessions[0]?.count ?? 0;
  const converted = conversions[0]?.count ?? 0;
  const plays = totalPlays[0]?.sum ?? 0;
  const correct = correctGuesses[0]?.sum ?? 0;

  return {
    totalSessions: total,
    activeSessions: active,
    conversionRate: total > 0 ? (converted / total) * 100 : 0,
    totalPlays: plays,
    averagePlaysPerSession: total > 0 ? plays / total : 0,
    correctGuessRate: plays > 0 ? (correct / plays) * 100 : 0,
    recentActivity: recentActivity.map(session => ({
      id: session.id,
      fingerprint: session.fingerprint,
      lastSeenAt: new Date(session.lastSeenAt),
      totalPlays: session.totalPlays,
      correctGuesses: session.correctGuesses,
      activities: session.activities.map(activity => ({
        type: activity.type,
        guess: activity.guess ?? undefined,
        timestamp: new Date(activity.timestamp),
        punchline: activity.punchline ? {
          line: activity.punchline.line,
        } : undefined,
      })),
    })),
  };
} 