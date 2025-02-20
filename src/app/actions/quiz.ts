"use server";

import { auth } from "auth";
import { z } from "zod";
import { db } from "~/server/db";
import { quizPunchlines, artists } from "~/server/db/schema";
import { requireAdmin } from "~/server/auth";
import { getArtist } from "~/server/spotify";
import { eq, desc } from "drizzle-orm";

const createQuizPunchlineSchema = z.object({
  line: z.string().min(1, "Punchline ist erforderlich"),
  songId: z.string().min(1, "Song ist erforderlich"),
  correctArtistId: z.string().min(1, "Korrekter Künstler ist erforderlich"),
  wrongArtist1Id: z.string().min(1, "Falscher Künstler 1 ist erforderlich"),
  wrongArtist2Id: z.string().min(1, "Falscher Künstler 2 ist erforderlich"),
});

async function ensureArtistExists(artistId: string) {
  // Check if artist exists
  const existingArtist = await db.query.artists.findFirst({
    where: eq(artists.id, artistId),
  });

  if (!existingArtist) {
    // Get artist from Spotify and import
    const artistData = await getArtist(artistId);
    if (!artistData) {
      throw new Error(`Artist ${artistId} not found on Spotify`);
    }

    await db.insert(artists).values({
      id: artistId,
      name: artistData.name,
      image: artistData.images[0]?.url,
      spotifyUrl: artistData.external_urls.spotify,
    });
  }
}

export type QuizPunchline = {
  id: number;
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
  correctArtist: {
    id: string;
    name: string;
    image: string | null;
  };
  wrongArtists: {
    id: string;
    name: string;
    image: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date | null;
};

export async function getQuizPunchlines() {
  await requireAdmin();

  try {
    const punchlines = await db.query.quizPunchlines.findMany({
      orderBy: [desc(quizPunchlines.createdAt)],
      with: {
        song: {
          with: {
            artist: true,
            album: true,
          },
        },
        correctArtist: true,
        wrongArtist1: true,
        wrongArtist2: true,
      },
    });

    return punchlines.map(punchline => ({
      id: punchline.id,
      line: punchline.line,
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
      correctArtist: {
        id: punchline.correctArtist.id,
        name: punchline.correctArtist.name,
        image: punchline.correctArtist.image,
      },
      wrongArtists: [
        {
          id: punchline.wrongArtist1.id,
          name: punchline.wrongArtist1.name,
          image: punchline.wrongArtist1.image,
        },
        {
          id: punchline.wrongArtist2.id,
          name: punchline.wrongArtist2.name,
          image: punchline.wrongArtist2.image,
        },
      ],
      createdAt: punchline.createdAt,
      updatedAt: punchline.updatedAt,
    }));
  } catch (error) {
    console.error("Failed to fetch quiz punchlines:", error);
    return [];
  }
}

export async function createQuizPunchline(formData: FormData) {
  await requireAdmin();

  const line = formData.get("line") as string;
  const songId = formData.get("songId") as string;
  const correctArtistId = formData.get("correctArtistId") as string;
  const wrongArtist1Id = formData.get("wrongArtist1Id") as string;
  const wrongArtist2Id = formData.get("wrongArtist2Id") as string;

  if (!line || !songId || !correctArtistId || !wrongArtist1Id || !wrongArtist2Id) {
    throw new Error("Missing required fields");
  }

  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Ensure all artists exist in the database
  await Promise.all([
    ensureArtistExists(correctArtistId),
    ensureArtistExists(wrongArtist1Id),
    ensureArtistExists(wrongArtist2Id),
  ]);

  await db.insert(quizPunchlines).values({
    line,
    songId,
    correctArtistId,
    wrongArtist1Id,
    wrongArtist2Id,
    createdById: session.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateQuizPunchline(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const line = formData.get("line") as string;
  const songId = formData.get("songId") as string;
  const correctArtistId = formData.get("correctArtistId") as string;
  const wrongArtist1Id = formData.get("wrongArtist1Id") as string;
  const wrongArtist2Id = formData.get("wrongArtist2Id") as string;

  if (!id || !line || !songId || !correctArtistId || !wrongArtist1Id || !wrongArtist2Id) {
    throw new Error("Missing required fields");
  }

  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Ensure all artists exist in the database
  await Promise.all([
    ensureArtistExists(correctArtistId),
    ensureArtistExists(wrongArtist1Id),
    ensureArtistExists(wrongArtist2Id),
  ]);

  await db.update(quizPunchlines)
    .set({
      line,
      songId,
      correctArtistId,
      wrongArtist1Id,
      wrongArtist2Id,
      updatedAt: new Date(),
    })
    .where(eq(quizPunchlines.id, Number(id)));
}

export async function deleteQuizPunchline(id: number) {
  await requireAdmin();
  await db.delete(quizPunchlines).where(eq(quizPunchlines.id, id));
} 