import { auth } from "auth";
import { NextResponse } from "next/server";
import { env } from "~/env";

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
];

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    scope: SCOPES.join(" "),
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`,
    state,
  });

  return NextResponse.json({
    url: `https://accounts.spotify.com/authorize?${params.toString()}`,
  });
} 