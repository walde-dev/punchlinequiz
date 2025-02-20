import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  primaryKey,
  sqliteTableCreator,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `punchlinequiz_${name}`);

export const artists = createTable(
  "artist",
  {
    id: text("id").primaryKey(), // Spotify ID
    name: text("name").notNull(),
    image: text("image"),
    spotifyUrl: text("spotify_url"),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (artist) => ({
    nameIdx: index("artist_name_idx").on(artist.name),
  })
);

export const albums = createTable(
  "album",
  {
    id: text("id").primaryKey(), // Spotify ID
    name: text("name").notNull(),
    image: text("image"),
    releaseDate: text("release_date"),
    spotifyUrl: text("spotify_url"),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (album) => ({
    nameIdx: index("album_name_idx").on(album.name),
    artistIdx: index("album_artist_idx").on(album.artistId),
  })
);

export const songs = createTable(
  "song",
  {
    id: text("id").primaryKey(), // Spotify ID
    name: text("name").notNull(),
    spotifyUrl: text("spotify_url"),
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (song) => ({
    nameIdx: index("song_name_idx").on(song.name),
    albumIdx: index("song_album_idx").on(song.albumId),
    artistIdx: index("song_artist_idx").on(song.artistId),
  })
);

export const punchlines = createTable(
  "punchline",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    line: text("line").notNull(),
    perfectSolution: text("perfect_solution").notNull(),
    acceptableSolutions: text("acceptable_solutions").notNull(), // Stored as JSON array
    songId: text("song_id")
      .notNull()
      .references(() => songs.id),
    createdById: text("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }),
  },
  (punchline) => ({
    createdByIdIdx: index("punchline_created_by_idx").on(punchline.createdById),
    songIdx: index("punchline_song_idx").on(punchline.songId),
  })
);

export const quizPunchlines = createTable(
  "quiz_punchline",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    line: text("line").notNull(),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id),
    correctArtistId: text("correct_artist_id")
      .notNull()
      .references(() => artists.id),
    wrongArtist1Id: text("wrong_artist_1_id")
      .notNull()
      .references(() => artists.id),
    wrongArtist2Id: text("wrong_artist_2_id")
      .notNull()
      .references(() => artists.id),
    createdById: text("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }),
  },
  (punchline) => ({
    createdByIdIdx: index("quiz_punchline_created_by_idx").on(punchline.createdById),
    songIdx: index("quiz_punchline_song_idx").on(punchline.songId),
  })
);

// Relations
export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  songs: many(songs),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, { fields: [albums.artistId], references: [artists.id] }),
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  album: one(albums, { fields: [songs.albumId], references: [albums.id] }),
  artist: one(artists, { fields: [songs.artistId], references: [artists.id] }),
  punchlines: many(punchlines),
}));

export const punchlineRelations = relations(punchlines, ({ one, many }) => ({
  song: one(songs, {
    fields: [punchlines.songId],
    references: [songs.id],
  }),
  createdBy: one(users, {
    fields: [punchlines.createdById],
    references: [users.id],
  }),
  solvedBy: many(solvedPunchlines),
}));

export const quizPunchlinesRelations = relations(quizPunchlines, ({ one }) => ({
  song: one(songs, {
    fields: [quizPunchlines.songId],
    references: [songs.id],
  }),
  correctArtist: one(artists, {
    fields: [quizPunchlines.correctArtistId],
    references: [artists.id],
  }),
  wrongArtist1: one(artists, {
    fields: [quizPunchlines.wrongArtist1Id],
    references: [artists.id],
  }),
  wrongArtist2: one(artists, {
    fields: [quizPunchlines.wrongArtist2Id],
    references: [artists.id],
  }),
  createdBy: one(users, {
    fields: [quizPunchlines.createdById],
    references: [users.id],
  }),
}));

export const posts = createTable(
  "post",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }),
    createdById: text("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }),
  },
  (example) => ({
    createdByIdIdx: index("created_by_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  })
);

export const users = createTable("user", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name", { length: 255 }),
  email: text("email", { length: 255 }).notNull(),
  emailVerified: int("email_verified", {
    mode: "timestamp",
  }).default(sql`(unixepoch())`),
  image: text("image", { length: 255 }),
  isAdmin: int("is_admin", { mode: "boolean" }).default(false).notNull(),
  onboardingCompleted: int("onboarding_completed", { mode: "boolean" }).default(false).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  punchlines: many(punchlines),
  solvedPunchlines: many(solvedPunchlines),
}));

export const accounts = createTable(
  "account",
  {
    userId: text("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: text("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider", { length: 255 }).notNull(),
    providerAccountId: text("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: text("token_type", { length: 255 }),
    scope: text("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: text("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: text("session_token", { length: 255 }).notNull().primaryKey(),
    userId: text("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier", { length: 255 }).notNull(),
    token: text("token", { length: 255 }).notNull(),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

export const solvedPunchlines = createTable(
  "solved_punchline",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    punchlineId: int("punchline_id")
      .notNull()
      .references(() => punchlines.id),
    solution: text("solution").notNull(), // The actual solution provided by the user
    solvedAt: int("solved_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (solved) => ({
    userIdIdx: index("solved_punchline_user_idx").on(solved.userId),
    punchlineIdIdx: index("solved_punchline_punchline_idx").on(solved.punchlineId),
    uniqueSolve: uniqueIndex("solved_punchline_unique_idx").on(solved.userId, solved.punchlineId), // Make sure each user can only solve each punchline once
  })
);

export const solvedPunchlinesRelations = relations(solvedPunchlines, ({ one }) => ({
  user: one(users, { fields: [solvedPunchlines.userId], references: [users.id] }),
  punchline: one(punchlines, { fields: [solvedPunchlines.punchlineId], references: [punchlines.id] }),
}));

export const anonymousSessions = createTable(
  "anonymous_session",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fingerprint: text("fingerprint").notNull(), // Browser fingerprint
    firstSeenAt: int("first_seen_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    lastSeenAt: int("last_seen_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    totalPlays: int("total_plays").default(0).notNull(),
    correctGuesses: int("correct_guesses").default(0).notNull(),
    convertedToUser: text("converted_to_user").references(() => users.id),
  },
  (session) => ({
    fingerprintIdx: index("anonymous_session_fingerprint_idx").on(session.fingerprint),
    convertedToUserIdx: index("anonymous_session_converted_user_idx").on(session.convertedToUser),
  })
);

export const anonymousActivity = createTable(
  "anonymous_activity",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    sessionId: text("session_id")
      .notNull()
      .references(() => anonymousSessions.id),
    type: text("type", { 
      enum: [
        "play",
        "correct_guess",
        "incorrect_guess",
        "oauth_click",
        "quiz_play",
        "quiz_correct_guess",
        "quiz_incorrect_guess",
        "game_start",
        "game_complete",
        "profile_update",
        "login",
        "logout"
      ] 
    }).notNull(),
    punchlineId: int("punchline_id").references(() => punchlines.id),
    guess: text("guess"),
    timestamp: int("timestamp", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (activity) => ({
    sessionIdx: index("anonymous_activity_session_idx").on(activity.sessionId),
    typeIdx: index("anonymous_activity_type_idx").on(activity.type),
    timestampIdx: index("anonymous_activity_timestamp_idx").on(activity.timestamp),
  })
);

// Add relations for anonymous sessions
export const anonymousSessionsRelations = relations(anonymousSessions, ({ one, many }) => ({
  activities: many(anonymousActivity),
  convertedUser: one(users, {
    fields: [anonymousSessions.convertedToUser],
    references: [users.id],
  }),
}));

export const anonymousActivityRelations = relations(anonymousActivity, ({ one }) => ({
  session: one(anonymousSessions, {
    fields: [anonymousActivity.sessionId],
    references: [anonymousSessions.id],
  }),
  punchline: one(punchlines, {
    fields: [anonymousActivity.punchlineId],
    references: [punchlines.id],
  }),
}));

export const quizGuesses = createTable(
  "quiz_guesses",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    sessionId: text("session_id")
      .notNull()
      .references(() => anonymousSessions.id),
    punchlineId: int("punchline_id")
      .notNull()
      .references(() => punchlines.id),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id),
    isCorrect: int("is_correct", { mode: "boolean" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (guess) => ({
    sessionIdx: index("quiz_guesses_session_idx").on(guess.sessionId),
    punchlineIdx: index("quiz_guesses_punchline_idx").on(guess.punchlineId),
    artistIdx: index("quiz_guesses_artist_idx").on(guess.artistId),
    userIdIdx: index("quiz_guesses_user_idx").on(guess.userId),
  })
);
