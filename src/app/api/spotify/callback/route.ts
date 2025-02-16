"use server";

import { auth } from "auth";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/admin?error=spotify-auth-failed", request.url),
    );
  }

  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to get access token");
    }

    const tokens = await tokenResponse.json();

    // Store the tokens in the database
    await db
      .insert(accounts)
      .values({
        userId: session.user.id,
        type: "oauth",
        provider: "spotify",
        providerAccountId: session.user.id,
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
      })
      .onConflictDoUpdate({
        target: [accounts.provider, accounts.providerAccountId],
        set: {
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
        },
      });

    return NextResponse.redirect(
      new URL("/admin?success=spotify-connected", request.url),
    );
  } catch (error) {
    console.error("Spotify auth error:", error);
    return NextResponse.redirect(
      new URL("/admin?error=spotify-auth-failed", request.url),
    );
  }
}
