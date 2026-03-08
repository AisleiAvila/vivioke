import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertLyric, InsertPerformance, InsertSong, InsertUser, lyrics, performances, songs, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import fs from "node:fs";
import path from "node:path";

let _db: ReturnType<typeof drizzle> | null = null;
let _localSongsCache: Awaited<ReturnType<typeof loadLocalSongsFromMedia>> | null = null;
let _localSongsCacheKey: string | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type LocalSong = {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  instrumentalUrl: string;
  originalUrl: string | null;
  coverImageUrl: string | null;
  genre: string | null;
  difficulty: "easy" | "medium" | "hard";
};

async function loadLocalSongsFromMedia(): Promise<LocalSong[]> {
  const mediaDir = process.env.VIVIOKE_MEDIA_DIR
    ? path.resolve(process.env.VIVIOKE_MEDIA_DIR)
    : path.resolve(process.cwd(), "media");
  const bdIniPath = path.join(mediaDir, "BD.ini");

  if (!fs.existsSync(mediaDir) || !fs.existsSync(bdIniPath)) {
    _localSongsCache = [];
    _localSongsCacheKey = null;
    return _localSongsCache;
  }

  const mediaFiles = fs
    .readdirSync(mediaDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".mp4"))
    .map((fileName) => fileName.toLowerCase())
    .toSorted();

  const filesInMedia = new Set(mediaFiles);

  const bdIniStats = fs.statSync(bdIniPath);
  const currentCacheKey = `${bdIniStats.mtimeMs}:${mediaFiles.join("|")}`;

  if (_localSongsCache && _localSongsCacheKey === currentCacheKey) {
    return _localSongsCache;
  }

  if (filesInMedia.size === 0) {
    _localSongsCache = [];
    _localSongsCacheKey = currentCacheKey;
    return _localSongsCache;
  }

  const raw = fs.readFileSync(bdIniPath).toString("latin1");
  const lines = raw.split(/\r?\n/);
  const parsedSongs: LocalSong[] = [];

  let currentId = "";
  let currentArtist = "";
  let currentTitle = "";
  let currentFile = "";

  const commitCurrent = () => {
    if (!currentId || !currentArtist || !currentTitle || !currentFile) {
      return;
    }

    if (!filesInMedia.has(currentFile.toLowerCase())) {
      return;
    }

    const numericId = Number.parseInt(currentId, 10);
    if (Number.isNaN(numericId)) {
      return;
    }

    parsedSongs.push({
      id: numericId,
      title: currentTitle.trim(),
      artist: currentArtist.trim(),
      album: null,
      duration: 0,
      instrumentalUrl: `/media/${encodeURIComponent(currentFile.trim())}`,
      originalUrl: null,
      coverImageUrl: null,
      genre: null,
      difficulty: "medium",
    });
  };

  const sectionPattern = /^\[(.+)]$/;

  for (const line of lines) {
    const sectionMatch = sectionPattern.exec(line);
    if (sectionMatch) {
      commitCurrent();
      currentId = sectionMatch[1].trim();
      currentArtist = "";
      currentTitle = "";
      currentFile = "";
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === "artista") {
      currentArtist = value;
      continue;
    }

    if (key === "musica") {
      currentTitle = value;
      continue;
    }

    if (key === "arquivo") {
      currentFile = value;
    }
  }

  commitCurrent();

  _localSongsCache = parsedSongs.toSorted((left, right) => left.id - right.id);
  _localSongsCacheKey = currentCacheKey;
  return _localSongsCache;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .split("")
    .filter((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      return codePoint < 0x0300 || codePoint > 0x036f;
    })
    .join("")
    .toLowerCase()
    .trim();
}

// Songs queries
export async function getAllSongs() {
  return await loadLocalSongsFromMedia();
}

export async function searchSongs(query: string) {
  const localSongs = await loadLocalSongsFromMedia();

  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return localSongs;
  }

  return localSongs.filter((song) => {
    const title = normalizeSearch(song.title);
    const artist = normalizeSearch(song.artist);
    return title.includes(normalizedQuery) || artist.includes(normalizedQuery);
  });
}

export async function getSongById(id: number) {
  const localSongs = await loadLocalSongsFromMedia();
  return localSongs.find((song) => song.id === id);
}

export async function createSong(data: InsertSong) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(songs).values(data);
  return result;
}

// Lyrics queries
export async function getLyricsBySongId(songId: number, language: string = "pt") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(lyrics)
    .where(and(eq(lyrics.songId, songId), eq(lyrics.language, language)))
    .limit(1);
  return result[0];
}

export async function createLyrics(data: InsertLyric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(lyrics).values(data);
}

// Performance queries
export async function createPerformance(data: InsertPerformance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(performances).values(data);
  return result;
}

export async function getUserPerformances(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(performances)
    .where(eq(performances.userId, userId))
    .orderBy(desc(performances.createdAt));
}

export async function getSongPerformances(songId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(performances)
    .where(eq(performances.songId, songId))
    .orderBy(desc(performances.score));
}

export async function getPerformanceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(performances)
    .where(eq(performances.id, id))
    .limit(1);
  return result[0];
}
