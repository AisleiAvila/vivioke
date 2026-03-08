import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { lyrics, songs } from "../drizzle/schema";
import { getDb } from "./db";

type SeedSong = {
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  instrumentalUrl: string;
  originalUrl: string | null;
  coverImageUrl: string | null;
  genre: string;
  difficulty: "easy" | "medium" | "hard";
  lyricsPt: string;
};

const seedSongs: SeedSong[] = [
  {
    title: "Parabéns pra Você",
    artist: "Tradicional",
    album: null,
    duration: 72,
    instrumentalUrl: "/media/parabens.mp4",
    originalUrl: null,
    coverImageUrl: null,
    genre: "Infantil",
    difficulty: "easy",
    lyricsPt: `[00:00.00]Parabéns pra você
[00:04.00]Nesta data querida
[00:08.00]Muitas felicidades
[00:12.00]Muitos anos de vida
[00:16.00]É pique, é pique
[00:20.00]É hora, é hora
[00:24.00]Ra tim bum`,
  },
  {
    title: "Asa Branca",
    artist: "Luiz Gonzaga",
    album: null,
    duration: 128,
    instrumentalUrl: "/media/asa-branca.mp4",
    originalUrl: null,
    coverImageUrl: null,
    genre: "Forró",
    difficulty: "medium",
    lyricsPt: `[00:00.00]Quando olhei a terra ardendo
[00:05.00]Qual fogueira de São João
[00:10.00]Eu perguntei a Deus do céu, ai
[00:15.00]Por que tamanha judiação`,
  },
  {
    title: "Stand By Me",
    artist: "Ben E. King",
    album: null,
    duration: 121,
    instrumentalUrl: "/media/stand-by-me.mp4",
    originalUrl: null,
    coverImageUrl: null,
    genre: "Soul",
    difficulty: "easy",
    lyricsPt: `[00:00.00]When the night has come
[00:04.00]And the land is dark
[00:08.00]And the moon is the only light we'll see
[00:14.00]No, I won't be afraid`,
  },
];

async function upsertSongWithLyrics(item: SeedSong) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available. Configure DATABASE_URL before running seed.");
  }

  const existingSong = await db
    .select({ id: songs.id })
    .from(songs)
    .where(and(eq(songs.title, item.title), eq(songs.artist, item.artist)))
    .limit(1);

  let songId: number;

  if (existingSong.length > 0) {
    songId = existingSong[0].id;

    await db
      .update(songs)
      .set({
        album: item.album,
        duration: item.duration,
        instrumentalUrl: item.instrumentalUrl,
        originalUrl: item.originalUrl,
        coverImageUrl: item.coverImageUrl,
        genre: item.genre,
        difficulty: item.difficulty,
      })
      .where(eq(songs.id, songId));
  } else {
    await db.insert(songs).values({
      title: item.title,
      artist: item.artist,
      album: item.album,
      duration: item.duration,
      instrumentalUrl: item.instrumentalUrl,
      originalUrl: item.originalUrl,
      coverImageUrl: item.coverImageUrl,
      genre: item.genre,
      difficulty: item.difficulty,
    });

    const insertedSong = await db
      .select({ id: songs.id })
      .from(songs)
      .where(and(eq(songs.title, item.title), eq(songs.artist, item.artist)))
      .limit(1);

    if (insertedSong.length === 0) {
      throw new Error(`Failed to insert song: ${item.title} - ${item.artist}`);
    }

    songId = insertedSong[0].id;
  }

  const existingLyric = await db
    .select({ id: lyrics.id })
    .from(lyrics)
    .where(and(eq(lyrics.songId, songId), eq(lyrics.language, "pt")))
    .limit(1);

  if (existingLyric.length === 0) {
    await db.insert(lyrics).values({
      songId,
      language: "pt",
      lrcContent: item.lyricsPt,
      version: 1,
    });
  }
}

async function main() {
  for (const item of seedSongs) {
    await upsertSongWithLyrics(item);
  }

  console.log(`Seed finalizado. ${seedSongs.length} músicas garantidas na base.`);
}

void main().catch((error) => {
  console.error("Erro ao executar seed:", error);
  process.exit(1);
});
