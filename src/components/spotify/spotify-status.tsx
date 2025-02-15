import { SpotifyConnectButton } from "./spotify-connect-button";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { StatusAlerts } from "./status-alerts";

interface SearchParams {
  success?: string;
  error?: string;
}

interface SpotifyStatusProps {
  userId: string;
  searchParams?: SearchParams;
}

export async function SpotifyStatus({
  userId,
  searchParams = {},
}: SpotifyStatusProps) {
  const spotifyAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "spotify")),
  });

  // Extract only the string values we need, with defensive checks
  const success = searchParams?.success ?? null;
  const error = searchParams?.error ?? null;

  return (
    <div className="space-y-4">
      <StatusAlerts success={success} error={error} />
      {!spotifyAccount && <SpotifyConnectButton />}
    </div>
  );
}
