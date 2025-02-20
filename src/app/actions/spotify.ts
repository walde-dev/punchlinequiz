"use server";

import { db } from "~/server/db";
import { albums, artists, songs, accounts } from "~/server/db/schema";
import { getAlbum, getArtist, getTrack, searchTrack, searchArtist } from "~/server/spotify";
import { eq, and } from "drizzle-orm";

export async function hasSpotifyAccount(userId: string) {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "spotify")),
  });
  return !!account;
}

export async function searchSongs(query: string) {
  const tracks = await searchTrack(query);
  return tracks;
}

export async function searchArtists(query: string) {
  const artists = await searchArtist(query);
  return artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    image: artist.images[0]?.url,
  }));
}

export async function importSong(songId: string) {
  const track = await getTrack(songId);

  if (!track) {
    throw new Error("Track not found");
  }

  // Get artist details
  const artistId = track.artists[0]?.id;
  if (!artistId) throw new Error("Artist not found");
  const artistData = await getArtist(artistId);
  if (!artistData) {
    throw new Error(`Failed to fetch artist data for ID: ${artistId}`);
  }

  // Get album details
  const albumId = track.album.id;
  if (!albumId) throw new Error("Album not found");
  const albumData = await getAlbum(albumId);
  if (!albumData) {
    throw new Error(`Failed to fetch album data for ID: ${albumId}`);
  }

  // Import artist if not exists
  const existingArtist = await db.query.artists.findFirst({
    where: eq(artists.id, artistId),
  });

  if (!existingArtist) {
    await db.insert(artists).values({
      id: artistId,
      name: artistData.name,
      image: artistData.images[0]?.url,
      spotifyUrl: artistData.external_urls.spotify,
    });
  }

  // Import album if not exists
  const existingAlbum = await db.query.albums.findFirst({
    where: eq(albums.id, albumId),
  });

  if (!existingAlbum) {
    await db.insert(albums).values({
      id: albumId,
      name: albumData.name,
      image: albumData.images[0]?.url,
      releaseDate: albumData.release_date,
      spotifyUrl: albumData.external_urls.spotify,
      artistId,
    });
  }

  // Import song if not exists
  const existingSong = await db.query.songs.findFirst({
    where: eq(songs.id, songId),
  });

  if (!existingSong) {
    await db.insert(songs).values({
      id: songId,
      name: track.name,
      spotifyUrl: track.external_urls.spotify,
      albumId,
      artistId,
    });
  }

  return {
    id: songId,
    name: track.name,
    artist: artistData.name,
    album: albumData.name,
    image: albumData.images[0]?.url,
  };
}

export async function getSpotifyAccount(userId: string) {
  return db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.provider, "spotify")),
  });
}
