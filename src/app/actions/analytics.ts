"use server";

import { sql, and, eq, desc } from "drizzle-orm";
import { db } from "~/server/db";
import {
  anonymousSessions,
  anonymousActivity,
  punchlines,
  users,
  solvedPunchlines,
} from "~/server/db/schema";
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
  wrongGuesses: {
    guess: string;
    count: number;
    timestamp: Date;
  }[];
};

export async function getPunchlineAnalytics() {
  await requireAdmin();

  // Get total number of users for percentage calculation
  const totalUsers = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .then((result) => result[0]?.count ?? 0);

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

  // Get wrong guesses for each punchline
  const wrongGuesses = await db
    .select({
      punchlineId: anonymousActivity.punchlineId,
      guess: anonymousActivity.guess,
      timestamp: anonymousActivity.timestamp,
    })
    .from(anonymousActivity)
    .where(
      sql`${anonymousActivity.type} = 'incorrect_guess' AND ${anonymousActivity.punchlineId} IS NOT NULL`,
    );

  // Group wrong guesses by punchline and guess
  const wrongGuessesByPunchline = wrongGuesses.reduce(
    (acc, { punchlineId, guess, timestamp }) => {
      if (!punchlineId || !guess) return acc;

      if (!acc[punchlineId]) {
        acc[punchlineId] = new Map();
      }

      const guessCount = acc[punchlineId].get(guess) || {
        count: 0,
        timestamp: new Date(timestamp),
      };
      acc[punchlineId].set(guess, {
        count: guessCount.count + 1,
        timestamp: new Date(
          Math.max(
            guessCount.timestamp.getTime(),
            new Date(timestamp).getTime(),
          ),
        ),
      });

      return acc;
    },
    {} as Record<number, Map<string, { count: number; timestamp: Date }>>,
  );

  return result.map((punchline) => ({
    id: punchline.id,
    line: punchline.line,
    song: {
      name: punchline.song.name,
      artist: punchline.song.artist.name,
    },
    totalSolves: punchline.solvedBy.length,
    solvePercentage:
      totalUsers > 0 ? (punchline.solvedBy.length / totalUsers) * 100 : 0,
    solvedBy: punchline.solvedBy.map((solve) => ({
      id: solve.user.id,
      name: solve.user.name,
      email: solve.user.email,
      image: solve.user.image,
      isAdmin: solve.user.isAdmin ?? false,
      solvedAt: new Date(solve.solvedAt),
      solution: solve.solution,
    })),
    wrongGuesses: wrongGuessesByPunchline[punchline.id]
      ? Array.from(wrongGuessesByPunchline[punchline.id]!.entries())
          .map(([guess, { count, timestamp }]) => ({
            guess,
            count,
            timestamp,
          }))
          .sort((a, b) => b.count - a.count)
      : [],
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
  const [currentUsers, currentActiveSessions] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db
      .select({ count: sql<number>`count(*)` })
      .from(anonymousSessions)
      .where(
        sql`${anonymousSessions.lastSeenAt} >= ${compareDate.getTime() / 1000}`,
      ),
  ]);

  // Previous period stats
  const [prevUsers, prevActiveSessionsResult] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(sql`${users.emailVerified} < ${compareDate.getTime() / 1000}`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(anonymousSessions)
      .where(
        sql`${anonymousSessions.lastSeenAt} >= ${
          new Date(compareDate.getTime() - (now.getTime() - compareDate.getTime())).getTime() / 1000
        } AND ${anonymousSessions.lastSeenAt} < ${compareDate.getTime() / 1000}`,
      ),
  ]);

  const totalUsers = currentUsers[0]?.count ?? 0;
  const activeSessions = currentActiveSessions[0]?.count ?? 0;

  const prevTotalUsers = prevUsers[0]?.count ?? 0;
  const prevActiveSessions = prevActiveSessionsResult[0]?.count ?? 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalUsers,
    activeSessions,
    changes: {
      users: calculateChange(totalUsers, prevTotalUsers),
      activeSessions: calculateChange(activeSessions, prevActiveSessions),
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
    convertedToUser?: string;
    user?: {
      id: string;
      name: string | null;
      image: string | null;
    };
    activities: {
      type: string;
      guess?: string;
      timestamp: Date;
      isLoggedIn: boolean;
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
    db
      .select({ count: sql<number>`count(*)` })
      .from(anonymousSessions)
      .where(
        sql`${anonymousSessions.lastSeenAt} >= ${compareDate.getTime() / 1000}`,
      ),
  ]);

  // Get conversion stats
  const conversions = await db
    .select({ count: sql<number>`count(*)` })
    .from(anonymousSessions)
    .where(sql`${anonymousSessions.convertedToUser} is not null`);

  // Get total plays and correct guesses
  const [totalPlays, correctGuesses] = await Promise.all([
    db
      .select({ sum: sql<number>`sum(${anonymousSessions.totalPlays})` })
      .from(anonymousSessions),
    db
      .select({ sum: sql<number>`sum(${anonymousSessions.correctGuesses})` })
      .from(anonymousSessions),
  ]);

  // Get recent activity
  const recentActivity = await db.query.anonymousSessions.findMany({
    orderBy: [desc(anonymousSessions.lastSeenAt)],
    limit: 10,
    with: {
      activities: {
        orderBy: [desc(anonymousActivity.timestamp)],
        limit: 10,
        with: {
          punchline: true,
        }
      },
      convertedUser: {
        columns: {
          id: true,
          name: true,
          image: true,
        }
      }
    }
  });

  const mappedActivity = recentActivity.map((session) => ({
    id: session.id,
    fingerprint: session.fingerprint,
    lastSeenAt: session.lastSeenAt,
    totalPlays: session.totalPlays,
    correctGuesses: session.correctGuesses,
    convertedToUser: session.convertedToUser,
    user: session.convertedUser,
    activities: session.activities.map((activity) => ({
      type: activity.type,
      guess: activity.guess,
      timestamp: activity.timestamp,
      isLoggedIn: !!session.convertedToUser,
      punchline: activity.punchline ? {
        line: activity.punchline.line
      } : undefined
    }))
  }));

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
    recentActivity: mappedActivity,
  };
}

export async function deleteWrongGuess(punchlineId: number, guess: string) {
  await requireAdmin();

  await db.delete(anonymousActivity)
    .where(and(
      eq(anonymousActivity.punchlineId, punchlineId),
      eq(anonymousActivity.type, "incorrect_guess"),
      eq(anonymousActivity.guess, guess)
    ));
}
