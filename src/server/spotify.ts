import { env } from "~/env";

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  tracks?: {
    items: SpotifyTrack[];
  };
  artists?: {
    items: SpotifyArtist[];
  };
}

async function getAccessToken(): Promise<string> {
  const clientId = env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      )}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function searchTrack(query: string): Promise<SpotifyTrack[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query,
    )}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data: SpotifySearchResponse = await response.json();
  return data.tracks?.items ?? [];
}

export async function searchArtist(query: string): Promise<SpotifyArtist[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query,
    )}&type=artist&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data: SpotifySearchResponse = await response.json();
  return data.artists?.items ?? [];
}

export async function getTrack(id: string): Promise<SpotifyTrack | null> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getArtist(id: string): Promise<SpotifyArtist | null> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getAlbum(id: string): Promise<SpotifyAlbum | null> {
  const accessToken = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
