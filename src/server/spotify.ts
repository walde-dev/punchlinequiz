import SpotifyWebApi from "spotify-web-api-node";
import { env } from "~/env";

export const spotifyApi = new SpotifyWebApi({
  clientId: env.SPOTIFY_CLIENT_ID,
  clientSecret: env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpirationTime = 0;

async function ensureAccessToken() {
  console.log("Checking Spotify token..."); // Debug log
  if (Date.now() > tokenExpirationTime - 1000) {
    console.log("Token expired, refreshing..."); // Debug log
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    tokenExpirationTime = Date.now() + data.body.expires_in * 1000;
    console.log("Token refreshed successfully"); // Debug log
  }
}

export async function searchTrack(query: string) {
  console.log("searchTrack called with query:", query); // Debug log
  await ensureAccessToken();
  const result = await spotifyApi.searchTracks(query);
  console.log("Spotify API response:", result.body.tracks?.items?.length, "items"); // Debug log
  return result.body.tracks?.items ?? [];
}

export async function getTrack(id: string) {
  await ensureAccessToken();
  const result = await spotifyApi.getTrack(id);
  return result.body;
}

export async function getArtist(id: string) {
  await ensureAccessToken();
  const result = await spotifyApi.getArtist(id);
  return result.body;
}

export async function getAlbum(id: string) {
  await ensureAccessToken();
  const result = await spotifyApi.getAlbum(id);
  return result.body;
} 