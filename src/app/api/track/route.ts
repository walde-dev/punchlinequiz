import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { anonymousActivity, anonymousSessions } from "~/server/db/schema";
import { getOrCreateAnonymousSession } from "~/app/actions/game";
import { auth } from "auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const formData = await request.formData();
  const fingerprint = formData.get("fingerprint") as string;
  const type = formData.get("type") as "play" | "correct_guess" | "incorrect_guess" | "oauth_click";
  const punchlineId = formData.get("punchlineId") ? Number(formData.get("punchlineId")) : undefined;
  const guess = formData.get("guess")?.toString();

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

    // Track the activity
    await db.insert(anonymousActivity).values({
      sessionId: anonymousSession.id,
      type,
      punchlineId,
      guess,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track activity:", error);
    return new NextResponse("Failed to track activity", { status: 500 });
  }
} 