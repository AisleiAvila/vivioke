import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Songs table - stores music information
 */
export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }),
  duration: int("duration").notNull(), // Duration in seconds
  instrumentalUrl: text("instrumentalUrl").notNull(), // S3 URL to instrumental version
  originalUrl: text("originalUrl"), // S3 URL to original with vocals (for reference)
  coverImageUrl: text("coverImageUrl"), // S3 URL to cover image
  genre: varchar("genre", { length: 100 }),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

/**
 * Lyrics table - stores synchronized lyrics in LRC format
 */
export const lyrics = mysqlTable("lyrics", {
  id: int("id").autoincrement().primaryKey(),
  songId: int("songId")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 10 }).default("pt"), // Language code (pt, en, etc)
  lrcContent: text("lrcContent").notNull(), // Full LRC file content
  version: int("version").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lyric = typeof lyrics.$inferSelect;
export type InsertLyric = typeof lyrics.$inferInsert;

/**
 * Performances table - stores user singing performances and scores
 */
export const performances = mysqlTable("performances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  songId: int("songId")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  score: int("score").notNull(), // 0-100
  pitchAccuracy: int("pitchAccuracy"), // 0-100, percentage of correct pitch
  timingAccuracy: int("timingAccuracy"), // 0-100, how well user stayed in time
  consistencyScore: int("consistencyScore"), // 0-100, stability of pitch
  recordingUrl: text("recordingUrl"), // S3 URL to recorded performance
  duration: int("duration"), // Duration of performance in seconds
  notes: text("notes"), // Detailed feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Performance = typeof performances.$inferSelect;
export type InsertPerformance = typeof performances.$inferInsert;