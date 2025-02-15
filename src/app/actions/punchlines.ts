"use server";

import { auth } from "auth";
import { z } from "zod";
import { db } from "~/server/db";
import { punchlines, songs, type artists, type albums } from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";

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
  const session = await auth();
  if (!session?.user) {
    return [];
  }

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
  const session = await auth();
  if (!session?.user) {
    return {
      error: "Du musst eingeloggt sein, um Punchlines hinzuzufügen",
    };
  }

  const rawData = {
    line: formData.get("line"),
    perfectSolution: formData.get("perfectSolution"),
    acceptableSolutions: formData.get("acceptableSolutions"),
    songId: formData.get("songId"),
  };

  const validatedData = createPunchlineSchema.safeParse(rawData);

  if (!validatedData.success) {
    return {
      error: "Ungültige Formulardaten",
      errors: validatedData.error.flatten().fieldErrors,
    };
  }

  try {
    const { acceptableSolutions, ...rest } = validatedData.data;

    await db.insert(punchlines).values({
      ...rest,
      acceptableSolutions: JSON.stringify(
        acceptableSolutions.split(",").map((s) => s.trim()),
      ),
      createdById: session.user.id,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create punchline:", error);
    return {
      error: "Punchline konnte nicht erstellt werden. Bitte versuche es erneut.",
    };
  }
}
