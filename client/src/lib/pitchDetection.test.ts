import { describe, it, expect } from "vitest";
import {
  frequencyToMidi,
  midiToFrequency,
  frequencyToNote,
  frequencyToCents,
  comparePitches,
  calculateSingingScore,
} from "./pitchDetection";

describe("Pitch Detection", () => {
  describe("frequencyToMidi", () => {
    it("should convert A4 (440 Hz) to MIDI note 69", () => {
      expect(frequencyToMidi(440)).toBe(69);
    });

    it("should convert C4 (261.63 Hz) to MIDI note 60", () => {
      expect(frequencyToMidi(261.63)).toBe(60);
    });

    it("should convert A3 (220 Hz) to MIDI note 57", () => {
      expect(frequencyToMidi(220)).toBe(57);
    });
  });

  describe("midiToFrequency", () => {
    it("should convert MIDI note 69 to A4 (440 Hz)", () => {
      expect(Math.round(midiToFrequency(69))).toBe(440);
    });

    it("should convert MIDI note 60 to C4 (261.63 Hz)", () => {
      expect(Math.round(midiToFrequency(60))).toBe(262);
    });

    it("should convert MIDI note 57 to A3 (220 Hz)", () => {
      expect(Math.round(midiToFrequency(57))).toBe(220);
    });
  });

  describe("frequencyToNote", () => {
    it("should convert 440 Hz to A4", () => {
      expect(frequencyToNote(440)).toBe("A4");
    });

    it("should convert 261.63 Hz to C4", () => {
      expect(frequencyToNote(261.63)).toBe("C4");
    });

    it("should convert 220 Hz to A3", () => {
      expect(frequencyToNote(220)).toBe("A3");
    });

    it("should convert 880 Hz to A5", () => {
      expect(frequencyToNote(880)).toBe("A5");
    });
  });

  describe("frequencyToCents", () => {
    it("should return 0 cents for exact note frequency", () => {
      const cents = frequencyToCents(440);
      expect(Math.abs(cents)).toBeLessThan(1);
    });

    it("should return positive cents for frequency above note", () => {
      const cents = frequencyToCents(450); // Slightly above A4
      expect(cents).toBeGreaterThan(0);
    });

    it("should return negative cents for frequency below note", () => {
      const cents = frequencyToCents(430); // Slightly below A4
      expect(cents).toBeLessThan(0);
    });

    it("should return ±100 cents for semitone difference", () => {
      const a4 = 440;
      const a4Sharp = a4 * Math.pow(2, 1 / 12); // One semitone up
      const cents = frequencyToCents(a4Sharp);
      expect(Math.abs(cents - 100)).toBeLessThan(5);
    });
  });

  describe("comparePitches", () => {
    it("should return 100 for exact pitch match", () => {
      const accuracy = comparePitches(440, 440);
      expect(accuracy).toBe(100);
    });

    it("should return high accuracy for close pitches", () => {
      const accuracy = comparePitches(442, 440); // 2 Hz difference
      expect(accuracy).toBeGreaterThan(90);
    });

    it("should return 0 for pitch outside tolerance", () => {
      const accuracy = comparePitches(400, 440, 50); // 40 semitones difference
      expect(accuracy).toBe(0);
    });

    it("should return 0 if user pitch is 0", () => {
      const accuracy = comparePitches(0, 440);
      expect(accuracy).toBe(0);
    });

    it("should return 0 if expected pitch is 0", () => {
      const accuracy = comparePitches(440, 0);
      expect(accuracy).toBe(0);
    });
  });

  describe("calculateSingingScore", () => {
    it("should return 0 for empty array", () => {
      const score = calculateSingingScore([]);
      expect(score).toBe(0);
    });

    it("should return average of accuracies", () => {
      const accuracies = [100, 80, 90];
      const score = calculateSingingScore(accuracies);
      expect(score).toBe(90);
    });

    it("should return 100 for perfect accuracies", () => {
      const accuracies = [100, 100, 100];
      const score = calculateSingingScore(accuracies);
      expect(score).toBe(100);
    });

    it("should handle single accuracy", () => {
      const accuracies = [75];
      const score = calculateSingingScore(accuracies);
      expect(score).toBe(75);
    });
  });
});
