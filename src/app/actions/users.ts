"use server";

import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { users, solvedPunchlines, anonymousActivity, anonymousSessions } from "~/server/db/schema";
import { requireAdmin } from "~/server/auth";
import { auth } from "auth";
import { getOrCreateAnonymousSession } from "./game";

export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  createdAt: number;
  solvedCount: number;
  activities?: {
    type: "play" | "correct_guess" | "incorrect_guess" | "quiz_play" | "quiz_correct_guess" | "quiz_incorrect_guess" | "oauth_click";
    timestamp: Date;
    punchline?: {
      line: string;
    };
  }[];
};

export async function getUsers() {
  await requireAdmin();

  // First get all users with their basic info
  const usersResult = await db
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

  // Then get activities for each user
  const usersWithActivities = await Promise.all(
    usersResult.map(async (user) => {
      // Get all sessions for this user - both converted and current
      const sessions = await db.query.anonymousSessions.findMany({
        where: sql`${anonymousSessions.convertedToUser} = ${user.id} OR ${anonymousSessions.fingerprint} = (
          SELECT fingerprint FROM punchlinequiz_anonymous_session 
          WHERE converted_to_user = ${user.id} 
          ORDER BY last_seen_at DESC 
          LIMIT 1
        )`,
      });

      if (!sessions.length) {
        return {
          ...user,
          createdAt: user.createdAt?.getTime() ?? Date.now(),
          activities: [],
        };
      }

      // Get activities for all sessions
      const sessionIds = sessions.map((s) => s.id);
      const activities = await db.query.anonymousActivity.findMany({
        where: sql`${anonymousActivity.sessionId} IN ${sessionIds}`,
        orderBy: [sql`${anonymousActivity.timestamp} DESC`],
        limit: 100, // Limit to last 100 activities
      });

      return {
        ...user,
        createdAt: user.createdAt?.getTime() ?? Date.now(),
        activities: activities.map(activity => ({
          type: activity.type,
          timestamp: activity.timestamp,
          isLoggedIn: !!sessions.find(s => s.convertedToUser),
          guess: activity.guess,
          punchline: activity.punchlineId ? {
            line: "Punchline " + activity.punchlineId,
          } : undefined,
        })),
      };
    })
  );

  return usersWithActivities;
} 