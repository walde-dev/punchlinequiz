import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { anonymousActivity, anonymousSessions, punchlines, quizPunchlines } from "~/server/db/schema";
import { getOrCreateAnonymousSession } from "~/app/actions/game";
import { auth } from "auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const data = await request.formData();
  const fingerprint = data.get("fingerprint") as string;
  const type = data.get("type") as "play" | "correct_guess" | "incorrect_guess" | "oauth_click" | "quiz_play" | "quiz_correct_guess" | "quiz_incorrect_guess";
  const punchlineId = data.get("punchlineId") ? Number(data.get("punchlineId")) : undefined;
  const guess = data.get("guess")?.toString() || data.get("artistId")?.toString();

  if (!fingerprint || !type) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  try {
    const session = await auth();
    const anonymousSession = await getOrCreateAnonymousSession(fingerprint);

    // If user is logged in, update the anonymous session to be linked to their account
    if (session?.user) {
      await db
        .update(anonymousSessions)
        .set({ convertedToUser: session.user.id })
        .where(eq(anonymousSessions.id, anonymousSession.id));
    }

    // Verify punchline exists if punchlineId is provided
    if (punchlineId) {
      // Check both regular punchlines and quiz punchlines
      const [regularPunchline, quizPunchline] = await Promise.all([
        db.query.punchlines.findFirst({
          where: eq(punchlines.id, punchlineId),
        }),
        db.query.quizPunchlines.findFirst({
          where: eq(quizPunchlines.id, punchlineId),
        }),
      ]);

      if (!regularPunchline && !quizPunchline) {
        console.error(`Punchline with ID ${punchlineId} not found in either table`);
        return new NextResponse("Punchline not found", { status: 404 });
      }
    }

    // Track the activity
    await db.insert(anonymousActivity).values({
      sessionId: anonymousSession.id,
      type,
      punchlineId: punchlineId ?? null,
      guess,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track activity:", error);
    return new NextResponse("Failed to track activity", { status: 500 });
  }
} 