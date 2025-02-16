"use server";
import { punchlines } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";

type SafePunchline = Omit<typeof punchlines.$inferSelect, 'perfectSolution' | 'acceptableSolutions'> & {
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
  return line
    .replace(/\{([^}]+)\}/, "...")
    .replace(/\[([^\]]+)\]/, "...");
}

export async function getRandomPunchline() {
  try {
    const result = await db.query.punchlines.findFirst({
      with: {
        song: {
          with: {
            artist: true,
            album: true,
          },
        },
      },
      orderBy: sql`RANDOM()`,
    });

    if (!result) {
      throw new Error("No punchlines found");
    }

    // Return a safe version without solutions
    const safePunchline: SafePunchline = {
      id: result.id,
      line: hideSolution(result.line),
      songId: result.songId,
      createdById: result.createdById,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      song: {
        id: result.song.id,
        name: result.song.name,
        artist: {
          id: result.song.artist.id,
          name: result.song.artist.name,
        },
        album: {
          id: result.song.album.id,
          name: result.song.album.name,
          image: result.song.album.image,
        },
      },
    };

    return safePunchline;
  } catch (error) {
    console.error("Failed to fetch random punchline:", error);
    throw new Error("Failed to fetch random punchline");
  }
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
    const normalizedGuess = parsed.guess.toLowerCase().trim();
    const isCorrect = acceptableSolutions.some(
      (solution) => solution.toLowerCase().trim() === normalizedGuess,
    );

    if (isCorrect) {
      // If correct, return the full punchline data
      return {
        isCorrect: true,
        punchline: punchline as FullPunchline,
      };
    }

    // If incorrect, only return the status
    return {
      isCorrect: false,
    };
  } catch (error) {
    console.error("Failed to validate guess:", error);
    throw new Error("Failed to validate guess");
  }
}
