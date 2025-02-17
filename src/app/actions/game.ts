"use server";
import { punchlines, solvedPunchlines, anonymousSessions, anonymousActivity, songs, artists, albums } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { auth } from "auth";

type SafePunchline = Omit<
  typeof punchlines.$inferSelect,
  "perfectSolution" | "acceptableSolutions"
> & {
  line: string;
  song: {
    id: string;
    name: string;
    artist: {
      id: string;
      name: string;
    };
    album: {
      id: string;
      name: string;
      image: string | null;
    };
  };
};

type FullPunchline = typeof punchlines.$inferSelect & {
  song: {
    id: string;
    name: string;
    artist: {
      id: string;
      name: string;
    };
    album: {
      id: string;
      name: string;
      image: string | null;
    };
  };
};

function hideSolution(line: string): string {
  return line.replace(/\{([^}]+)\}/, "...").replace(/\[([^\]]+)\]/, "...");
}

function normalizeText(text: string): string {
  let normalizedText = text.toLowerCase();

  //remove all double spaces
  normalizedText = normalizedText.replace(/\s+/g, " ");
  //remove all leading and trailing spaces
  normalizedText = normalizedText.trim();
  //replace ß with ss
  normalizedText = normalizedText.replace("ß", "ss");
  //remove all commas
  normalizedText = normalizedText.replace(",", "");
  //remove all dots
  normalizedText = normalizedText.replace(".", "");
  //remove all question marks
  normalizedText = normalizedText.replace("?", "");
  //remove all exclamation marks
  normalizedText = normalizedText.replace("!", "");
  //remove all colons
  normalizedText = normalizedText.replace(":", "");
  //remove all semicolons
  normalizedText = normalizedText.replace(";", "");
  //remove all spaces and special characters
  normalizedText = normalizedText.replace(/[^a-z0-9]/g, "");

  return normalizedText;
}

async function getOrCreateAnonymousSession(fingerprint: string) {
  // Try to find an existing session
  const existingSession = await db.query.anonymousSessions.findFirst({
    where: sql`${anonymousSessions.fingerprint} = ${fingerprint}`,
  });

  if (existingSession) {
    // Update last seen
    await db.update(anonymousSessions)
      .set({ lastSeenAt: new Date() })
      .where(sql`${anonymousSessions.id} = ${existingSession.id}`);
    return existingSession;
  }

  // Create new session
  const [newSession] = await db.insert(anonymousSessions)
    .values({
      fingerprint,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    })
    .returning();

  if (!newSession) {
    throw new Error("Failed to create anonymous session");
  }

  return newSession;
}

export async function getRandomPunchline() {
  try {
    const session = await auth();

    // Base query to get a random punchline
    const baseQuery = {
      with: {
        song: {
          with: {
            artist: true as const,
            album: true as const,
          },
        },
      },
    } as const;

    // If user is logged in, exclude solved punchlines
    const result = await db.query.punchlines.findFirst({
      ...baseQuery,
      where: session?.user ? sql`${punchlines.id} NOT IN (
        SELECT punchline_id 
        FROM punchlinequiz_solved_punchline 
        WHERE user_id = ${session.user.id}
      )` : undefined,
      orderBy: sql`RANDOM()`,
    });

    if (!result) {
      // For logged-in users who have solved all punchlines
      if (session?.user) {
        // Get total punchline count to confirm
        const [totalCount] = await db.select({ 
          count: sql<number>`count(*)` 
        }).from(punchlines);

        const [solvedCount] = await db.select({ 
          count: sql<number>`count(*)` 
        })
        .from(solvedPunchlines)
        .where(eq(solvedPunchlines.userId, session.user.id));

        // If user has truly solved all punchlines
        if (totalCount?.count === solvedCount?.count) {
          return { allSolved: true as const };
        }
      }

      // If no unsolved punchlines found, return a random one from all punchlines
      const anyPunchline = await db.query.punchlines.findFirst({
        ...baseQuery,
        orderBy: sql`RANDOM()`,
      });

      if (!anyPunchline) {
        throw new Error("No punchlines found");
      }

      return formatSafePunchline(anyPunchline);
    }

    return formatSafePunchline(result);
  } catch (error) {
    console.error("Failed to fetch random punchline:", error);
    throw new Error("Failed to fetch random punchline");
  }
}

// Helper function to format the punchline into a safe version
function formatSafePunchline(punchline: typeof punchlines.$inferSelect & {
  song: typeof songs.$inferSelect & {
    artist: typeof artists.$inferSelect;
    album: typeof albums.$inferSelect;
  };
}): SafePunchline {
  return {
    id: punchline.id,
    line: hideSolution(punchline.line),
    songId: punchline.songId,
    createdById: punchline.createdById,
    createdAt: punchline.createdAt,
    updatedAt: punchline.updatedAt,
    song: {
      id: punchline.song.id,
      name: punchline.song.name,
      artist: {
        id: punchline.song.artist.id,
        name: punchline.song.artist.name,
      },
      album: {
        id: punchline.song.album.id,
        name: punchline.song.album.name,
        image: punchline.song.album.image,
      },
    },
  };
}

export async function getFullPunchlineAfterCorrectGuess(punchlineId: number) {
  try {
    const result = await db.query.punchlines.findFirst({
      where: eq(punchlines.id, punchlineId),
      with: {
        song: {
          with: {
            artist: true,
            album: true,
          },
        },
      },
    });

    if (!result) {
      throw new Error("Punchline not found");
    }

    return result as FullPunchline;
  } catch (error) {
    console.error("Failed to fetch full punchline:", error);
    throw new Error("Failed to fetch full punchline");
  }
}

const validateGuessSchema = z.object({
  punchlineId: z.number(),
  guess: z.string().min(1, "Guess is required"),
});

export async function validateGuess(formData: FormData) {
  const session = await auth();
  const fingerprint = formData.get("fingerprint") as string;
  const parsed = validateGuessSchema.parse({
    punchlineId: Number(formData.get("punchlineId")),
    guess: formData.get("guess"),
  });

  try {
    const punchline = await db.query.punchlines.findFirst({
      where: eq(punchlines.id, parsed.punchlineId),
      with: {
        song: {
          with: {
            artist: true,
            album: true,
          },
        },
      },
    });

    if (!punchline) {
      throw new Error("Punchline not found");
    }

    const acceptableSolutions = JSON.parse(
      punchline.acceptableSolutions,
    ) as string[];
    const normalizedGuess = normalizeText(parsed.guess);
    const isCorrect = acceptableSolutions.some(
      (solution) => normalizeText(solution) === normalizedGuess,
    );

    // Track activity for anonymous users
    if (!session?.user && fingerprint) {
      const anonymousSession = await getOrCreateAnonymousSession(fingerprint);

      // Record the guess attempt
      await db.insert(anonymousActivity).values({
        sessionId: anonymousSession.id,
        type: isCorrect ? "correct_guess" : "incorrect_guess",
        punchlineId: punchline.id,
        guess: parsed.guess,
      });

      // Update session stats
      await db.update(anonymousSessions)
        .set({
          totalPlays: sql`${anonymousSessions.totalPlays} + 1`,
          correctGuesses: sql`${anonymousSessions.correctGuesses} + ${isCorrect ? 1 : 0}`,
        })
        .where(sql`${anonymousSessions.id} = ${anonymousSession.id}`);
    }

    if (isCorrect && session?.user) {
      // Record the successful attempt for logged-in users
      await db.insert(solvedPunchlines).values({
        userId: session.user.id,
        punchlineId: punchline.id,
        solution: parsed.guess,
      }).onConflictDoNothing();
    }

    if (isCorrect) {
      return {
        isCorrect: true,
        punchline: punchline as FullPunchline,
      };
    }

    return {
      isCorrect: false,
    };
  } catch (error) {
    console.error("Failed to validate guess:", error);
    throw new Error("Failed to validate guess");
  }
}

export async function startNewGame(fingerprint: string) {
  try {
    // Track activity for anonymous users
    if (fingerprint) {
      const anonymousSession = await getOrCreateAnonymousSession(fingerprint);
      await db.insert(anonymousActivity).values({
        sessionId: anonymousSession.id,
        type: "play",
      });
    }

    const punchline = await getRandomPunchline();
    return punchline;
  } catch (error) {
    console.error("Failed to start new game:", error);
    throw new Error("Failed to start new game");
  }
}
