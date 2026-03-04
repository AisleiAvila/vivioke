import { describe, it, expect } from "vitest";
import {
  timeToMs,
  msToTime,
  parseLRC,
  getCurrentLyric,
  getNextLyric,
  getTimeToNextLyric,
  getVisibleLyrics,
  formatLyricDisplay,
} from "./lrcParser";

describe("LRC Parser", () => {
  describe("timeToMs", () => {
    it("should convert time string to milliseconds", () => {
      expect(timeToMs("00:00.00")).toBe(0);
      expect(timeToMs("00:01.00")).toBe(1000);
      expect(timeToMs("01:00.00")).toBe(60000);
      expect(timeToMs("01:30.50")).toBe(90500);
      expect(timeToMs("02:15.75")).toBe(135750);
    });

    it("should handle invalid time strings", () => {
      expect(timeToMs("invalid")).toBe(0);
      expect(timeToMs("")).toBe(0);
    });
  });

  describe("msToTime", () => {
    it("should convert milliseconds to time string", () => {
      expect(msToTime(0)).toBe("00:00.00");
      expect(msToTime(1000)).toBe("00:01.00");
      expect(msToTime(60000)).toBe("01:00.00");
      expect(msToTime(90500)).toBe("01:30.50");
      expect(msToTime(135750)).toBe("02:15.75");
    });
  });

  describe("parseLRC", () => {
    it("should parse basic LRC content", () => {
      const lrcContent = `[ti:Test Song]
[ar:Test Artist]
[00:00.00]First line
[00:05.00]Second line
[00:10.00]Third line`;

      const result = parseLRC(lrcContent);

      expect(result.metadata.ti).toBe("Test Song");
      expect(result.metadata.ar).toBe("Test Artist");
      expect(result.lyrics).toHaveLength(3);
      expect(result.lyrics[0].text).toBe("First line");
      expect(result.lyrics[0].timestamp).toBe(0);
      expect(result.lyrics[1].text).toBe("Second line");
      expect(result.lyrics[1].timestamp).toBe(5000);
    });

    it("should sort lyrics by timestamp", () => {
      const lrcContent = `[00:10.00]Third
[00:00.00]First
[00:05.00]Second`;

      const result = parseLRC(lrcContent);

      expect(result.lyrics[0].text).toBe("First");
      expect(result.lyrics[1].text).toBe("Second");
      expect(result.lyrics[2].text).toBe("Third");
    });

    it("should skip empty lines", () => {
      const lrcContent = `[00:00.00]First

[00:05.00]Second`;

      const result = parseLRC(lrcContent);

      expect(result.lyrics).toHaveLength(2);
    });
  });

  describe("getCurrentLyric", () => {
    const lyrics = [
      { timestamp: 0, text: "First", startTime: "00:00.00" },
      { timestamp: 5000, text: "Second", startTime: "00:05.00" },
      { timestamp: 10000, text: "Third", startTime: "00:10.00" },
    ];

    it("should return current lyric", () => {
      expect(getCurrentLyric(lyrics, 0)).toEqual(lyrics[0]);
      expect(getCurrentLyric(lyrics, 2500)).toEqual(lyrics[0]);
      expect(getCurrentLyric(lyrics, 5000)).toEqual(lyrics[1]);
      expect(getCurrentLyric(lyrics, 7500)).toEqual(lyrics[1]);
    });

    it("should return null if no current lyric", () => {
      expect(getCurrentLyric(lyrics, -1000)).toBeNull();
    });
  });

  describe("getNextLyric", () => {
    const lyrics = [
      { timestamp: 0, text: "First", startTime: "00:00.00" },
      { timestamp: 5000, text: "Second", startTime: "00:05.00" },
      { timestamp: 10000, text: "Third", startTime: "00:10.00" },
    ];

    it("should return next lyric", () => {
      expect(getNextLyric(lyrics, 0)).toEqual(lyrics[1]);
      expect(getNextLyric(lyrics, 2500)).toEqual(lyrics[1]);
      expect(getNextLyric(lyrics, 5000)).toEqual(lyrics[2]);
    });

    it("should return null if no next lyric", () => {
      expect(getNextLyric(lyrics, 10000)).toBeNull();
      expect(getNextLyric(lyrics, 15000)).toBeNull();
    });
  });

  describe("getTimeToNextLyric", () => {
    const lyrics = [
      { timestamp: 0, text: "First", startTime: "00:00.00" },
      { timestamp: 5000, text: "Second", startTime: "00:05.00" },
      { timestamp: 10000, text: "Third", startTime: "00:10.00" },
    ];

    it("should return time to next lyric", () => {
      expect(getTimeToNextLyric(lyrics, 0)).toBe(5000);
      expect(getTimeToNextLyric(lyrics, 2500)).toBe(2500);
      expect(getTimeToNextLyric(lyrics, 5000)).toBe(5000);
    });

    it("should return null if no next lyric", () => {
      expect(getTimeToNextLyric(lyrics, 10000)).toBeNull();
    });
  });

  describe("getVisibleLyrics", () => {
    const lyrics = [
      { timestamp: 0, text: "First", startTime: "00:00.00" },
      { timestamp: 5000, text: "Second", startTime: "00:05.00" },
      { timestamp: 10000, text: "Third", startTime: "00:10.00" },
      { timestamp: 15000, text: "Fourth", startTime: "00:15.00" },
    ];

    it("should return visible lyrics", () => {
      const visible = getVisibleLyrics(lyrics, 5000, 2);
      expect(visible).toHaveLength(2);
      expect(visible[0].text).toBe("Second");
      expect(visible[1].text).toBe("Third");
    });

    it("should respect line count limit", () => {
      const visible = getVisibleLyrics(lyrics, 0, 2);
      expect(visible).toHaveLength(2);
    });
  });

  describe("formatLyricDisplay", () => {
    const lyrics = [
      { timestamp: 0, text: "First", startTime: "00:00.00" },
      { timestamp: 5000, text: "Second", startTime: "00:05.00" },
      { timestamp: 10000, text: "Third", startTime: "00:10.00" },
    ];

    it("should format lyrics for display", () => {
      const display = formatLyricDisplay(lyrics, 5000, 2);
      expect(display.current).toBe("Second");
      expect(display.next).toContain("Third");
    });

    it("should return empty current if no current lyric", () => {
      const display = formatLyricDisplay(lyrics, -1000, 2);
      expect(display.current).toBe("");
    });
  });
});
