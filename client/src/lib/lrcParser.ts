/**
 * LRC Parser - Parses LRC (Lyrics) format files
 * LRC format: [mm:ss.xx]Lyrics text
 */

export interface LyricLine {
  timestamp: number; // in milliseconds
  text: string;
  startTime: string; // formatted as mm:ss.xx
}

export interface ParsedLyrics {
  metadata: Record<string, string>;
  lyrics: LyricLine[];
}

/**
 * Convert timestamp string (mm:ss.xx) to milliseconds
 */
export function timeToMs(timeStr: string): number {
  const parts = timeStr.match(/(\d+):(\d+)\.(\d+)/);
  if (!parts) return 0;

  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const centiseconds = parseInt(parts[3], 10);

  return minutes * 60000 + seconds * 1000 + centiseconds * 10;
}

/**
 * Convert milliseconds to timestamp string (mm:ss.xx)
 */
export function msToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

/**
 * Parse LRC content and return structured lyrics
 */
export function parseLRC(content: string): ParsedLyrics {
  const lines = content.split("\n");
  const metadata: Record<string, string> = {};
  const lyrics: LyricLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Parse metadata (lines starting with [tag:value])
    const metadataMatch = trimmed.match(/^\[([a-z]+):(.+)\]$/i);
    if (metadataMatch) {
      const [, key, value] = metadataMatch;
      metadata[key.toLowerCase()] = value;
      continue;
    }

    // Parse lyrics (lines with [mm:ss.xx]text)
    const lyricMatch = trimmed.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
    if (lyricMatch) {
      const [, minutes, seconds, centiseconds, text] = lyricMatch;
      const timestamp = timeToMs(`${minutes}:${seconds}.${centiseconds}`);

      lyrics.push({
        timestamp,
        text,
        startTime: `${minutes}:${seconds}.${centiseconds}`,
      });
    }
  }

  // Sort lyrics by timestamp
  lyrics.sort((a, b) => a.timestamp - b.timestamp);

  return { metadata, lyrics };
}

/**
 * Get current lyric line based on current time
 */
export function getCurrentLyric(lyrics: LyricLine[], currentTimeMs: number): LyricLine | null {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (lyrics[i].timestamp <= currentTimeMs) {
      return lyrics[i];
    }
  }
  return null;
}

/**
 * Get next lyric line based on current time
 */
export function getNextLyric(lyrics: LyricLine[], currentTimeMs: number): LyricLine | null {
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timestamp > currentTimeMs) {
      return lyrics[i];
    }
  }
  return null;
}

/**
 * Get time until next lyric (in milliseconds)
 */
export function getTimeToNextLyric(lyrics: LyricLine[], currentTimeMs: number): number | null {
  const nextLyric = getNextLyric(lyrics, currentTimeMs);
  if (!nextLyric) return null;
  return nextLyric.timestamp - currentTimeMs;
}

/**
 * Get visible lyrics (current and next few lines)
 */
export function getVisibleLyrics(
  lyrics: LyricLine[],
  currentTimeMs: number,
  lineCount: number = 3
): LyricLine[] {
  const visible: LyricLine[] = [];
  let foundCurrent = false;

  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timestamp <= currentTimeMs) {
      foundCurrent = true;
      visible.push(lyrics[i]);
    } else if (foundCurrent && visible.length < lineCount) {
      visible.push(lyrics[i]);
    } else if (foundCurrent && visible.length >= lineCount) {
      break;
    }
  }

  return visible;
}

/**
 * Format lyrics for display with optional highlighting
 */
export function formatLyricDisplay(
  lyrics: LyricLine[],
  currentTimeMs: number,
  nextLineCount: number = 2
): {
  current: string;
  next: string[];
} {
  const currentLyric = getCurrentLyric(lyrics, currentTimeMs);
  const nextLyrics: LyricLine[] = [];

  if (currentLyric) {
    const currentIndex = lyrics.indexOf(currentLyric);
    for (let i = 1; i <= nextLineCount && currentIndex + i < lyrics.length; i++) {
      nextLyrics.push(lyrics[currentIndex + i]);
    }
  }

  return {
    current: currentLyric?.text || "",
    next: nextLyrics.map((l) => l.text),
  };
}
