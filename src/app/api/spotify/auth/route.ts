import { auth } from "auth";
import { NextResponse } from "next/server";
import { env } from "~/env";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
];

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.SPOTIFY_CLIENT_ID,
    scope: SCOPES.join(" "),
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`,
    state,
  });

  return NextResponse.json({ url: `${SPOTIFY_AUTH_URL}?${params.toString()}` });
} 