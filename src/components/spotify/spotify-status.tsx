"use client";

import { SpotifyConnectButton } from "./spotify-connect-button";
import { StatusAlerts } from "./status-alerts";
import { hasSpotifyAccount } from "~/app/actions/spotify";
import { useEffect, useState } from "react";

interface SearchParams {
  success?: string;
  error?: string;
}

interface SpotifyStatusProps {
  userId: string;
  searchParams: SearchParams;
}

export function SpotifyStatus({
  userId,
  searchParams,
}: SpotifyStatusProps) {
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    hasSpotifyAccount(userId).then(setHasAccount);
  }, [userId]);

  return (
    <div className="flex items-center gap-2">
      {!hasAccount && <SpotifyConnectButton />}
      <StatusAlerts searchParams={searchParams} />
    </div>
  );
}
