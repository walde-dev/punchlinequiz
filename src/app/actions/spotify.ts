"use server";

import { auth } from "auth";
import { db } from "~/server/db";
import { albums, artists, songs } from "~/server/db/schema";
import { getAlbum, getArtist, searchTrack } from "~/server/spotify";
import { eq } from "drizzle-orm";

export async function searchSongs(query: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const tracks = await searchTrack(query);
  return tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0]?.name ?? "Unknown Artist",
    artistId: track.artists[0]?.id,
    album: track.album.name,
    albumId: track.album.id,
    image: track.album.images[0]?.url,
  }));
}

export async function importSong(songId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Get track details
  const track = await searchTrack(`spotify:track:${songId}`);
  if (!track.length) throw new Error("Song not found");
  const songData = track[0];

  // Get artist details
  const artistId = songData?.artists[0]?.id;
  if (!artistId) throw new Error("Artist not found");
  const artistData = await getArtist(artistId);

  // Get album details
  const albumId = songData?.album.id;
  if (!albumId) throw new Error("Album not found");
  const albumData = await getAlbum(albumId);

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
      name: songData.name,
      spotifyUrl: songData.external_urls.spotify,
      albumId,
      artistId,
    });
  }

  return {
    id: songId,
    name: songData.name,
    artist: artistData.name,
    album: albumData.name,
    image: albumData.images[0]?.url,
  };
}
