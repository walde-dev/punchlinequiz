import { db } from "~/server/db";
import { punchlines } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export async function getRandomPunchline() {
  try {
    // Get a random punchline with its related song and artist information
    const result = await db.query.punchlines.findFirst({
      with: {
        song: {
          with: {
            artist: true,
            album: true,
          },
        },
      },
      // Random order
      orderBy: sql`RANDOM()`,
    });

    if (!result) {
      throw new Error("No punchlines found");
    }

    // Parse the acceptable solutions from JSON string
    const acceptableSolutions = JSON.parse(result.acceptableSolutions) as string[];

    return {
      ...result,
      acceptableSolutions,
      // Don't send the perfect solution to the client
      perfectSolution: undefined,
    };
  } catch (error) {
    console.error("Failed to fetch random punchline:", error);
    throw new Error("Failed to fetch random punchline");
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
    });

    if (!punchline) {
      throw new Error("Punchline not found");
    }

    const acceptableSolutions = JSON.parse(punchline.acceptableSolutions) as string[];
    const normalizedGuess = parsed.guess.toLowerCase().trim();
    const isCorrect = acceptableSolutions.some(
      (solution) => solution.toLowerCase().trim() === normalizedGuess
    );

    return {
      isCorrect,
      perfectSolution: isCorrect ? punchline.perfectSolution : undefined,
    };
  } catch (error) {
    console.error("Failed to validate guess:", error);
    throw new Error("Failed to validate guess");
  }
} 