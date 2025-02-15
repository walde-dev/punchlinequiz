"use server";

import { auth } from "auth";
import { z } from "zod";
import { db } from "~/server/db";
import {
  punchlines,
  songs,
  type artists,
  type albums,
} from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "~/server/auth";

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

  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  await db.insert(punchlines).values({
    line,
    perfectSolution,
    acceptableSolutions,
    songId,
    createdById: session.user.id,
    updatedAt: new Date(),
  });
}

export async function deletePunchline(id: number) {
  await requireAdmin();

  await db.delete(punchlines).where(eq(punchlines.id, id));
}
