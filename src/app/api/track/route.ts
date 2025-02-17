import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { anonymousActivity } from "~/server/db/schema";
import { getOrCreateAnonymousSession } from "~/app/actions/game";

export async function POST(request: Request) {
  const formData = await request.formData();
  const fingerprint = formData.get("fingerprint") as string;
  const type = formData.get("type") as "play" | "correct_guess" | "incorrect_guess" | "oauth_click";

  if (!fingerprint || !type) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  try {
    const anonymousSession = await getOrCreateAnonymousSession(fingerprint);
    await db.insert(anonymousActivity).values({
      sessionId: anonymousSession.id,
      type,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track activity:", error);
    return new NextResponse("Failed to track activity", { status: 500 });
  }
} 