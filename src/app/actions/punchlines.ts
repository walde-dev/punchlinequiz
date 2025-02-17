"use server";

import { auth } from "auth";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { punchlines } from "~/server/db/schema";
import type { songs, albums, artists } from "~/server/db/schema";
import { requireAdmin } from "~/server/auth";
import { db } from "~/server/db";
import { anonymousActivity } from "~/server/db/schema";

const createPunchlineSchema = z.object({
  line: z.string().min(1, "Punchline ist erforderlich"),
  perfectSolution: z.string().min(1, "Perfekte Lösung ist erforderlich"),
  acceptableSolutions: z
    .string()
    .min(1, "Mindestens eine akzeptierte Lösung ist erforderlich"),
  songId: z.string().min(1, "Song ist erforderlich"),
});

export type Punchline = typeof punchlines.$inferSelect & {
  song: typeof songs.$inferSelect & {
    artist: typeof artists.$inferSelect;
    album: typeof albums.$inferSelect;
  };
};

export async function getPunchlines() {
  await requireAdmin();

  try {
    return await db.query.punchlines.findMany({
      orderBy: [desc(punchlines.createdAt)],
      with: {
        song: {
          with: {
            artist: true,
            album: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch punchlines:", error);
    return [];
  }
}

export async function createPunchline(formData: FormData) {
  await requireAdmin();

  const line = formData.get("line") as string;
  const perfectSolution = formData.get("perfectSolution") as string;
  const acceptableSolutions = formData.get("acceptableSolutions") as string;
  const songId = formData.get("songId") as string;

  if (!line || !perfectSolution || !acceptableSolutions || !songId) {
    throw new Error("Missing required fields");
  }

  // Split the acceptable solutions by comma and trim whitespace
  const solutions = acceptableSolutions.split(",").map(s => s.trim());
  // Add the perfect solution as an acceptable solution if not already included
  if (!solutions.includes(perfectSolution)) {
    solutions.push(perfectSolution);
  }

  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  await db.insert(punchlines).values({
    line,
    perfectSolution,
    acceptableSolutions: JSON.stringify(solutions),
    songId,
    createdById: session.user.id,
    updatedAt: new Date(),
  });
}

export async function deletePunchline(id: number) {
  await requireAdmin();

  // Delete wrong guesses first
  await db.delete(anonymousActivity)
    .where(and(
      eq(anonymousActivity.punchlineId, id),
      eq(anonymousActivity.type, "incorrect_guess")
    ));

  // Then delete the punchline
  await db.delete(punchlines)
    .where(eq(punchlines.id, id));
}

export async function updatePunchline(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const line = formData.get("line") as string;
  const perfectSolution = formData.get("perfectSolution") as string;
  const acceptableSolutions = formData.get("acceptableSolutions") as string;
  const songId = formData.get("songId") as string;

  if (!id || !line || !perfectSolution || !acceptableSolutions || !songId) {
    throw new Error("Missing required fields");
  }

  // Split the acceptable solutions by comma and trim whitespace
  const solutions = acceptableSolutions.split(",").map(s => s.trim());
  // Add the perfect solution as an acceptable solution if not already included
  if (!solutions.includes(perfectSolution)) {
    solutions.push(perfectSolution);
  }

  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Delete wrong guesses for this punchline
  await db.delete(anonymousActivity)
    .where(and(
      eq(anonymousActivity.punchlineId, Number(id)),
      eq(anonymousActivity.type, "incorrect_guess")
    ));

  // Update the punchline
  await db.update(punchlines)
    .set({
      line,
      perfectSolution,
      acceptableSolutions: JSON.stringify(solutions),
      songId,
      updatedAt: new Date(),
    })
    .where(eq(punchlines.id, Number(id)));
}
