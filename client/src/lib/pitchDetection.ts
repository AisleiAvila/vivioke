/**
 * Pitch Detection using Web Audio API and Autocorrelation
 * Based on the autocorrelation method for accurate pitch detection
 */

export interface PitchData {
  frequency: number; // Hz
  note: string; // e.g., "C4", "A4"
  cents: number; // deviation from note in cents (±100 cents = 1 semitone)
  confidence: number; // 0-1, confidence in the detection
  amplitude: number; // 0-1, volume level
}

export interface AudioAnalyzerConfig {
  fftSize?: number;
  minFrequency?: number;
  maxFrequency?: number;
  smoothingFactor?: number;
}

/**
 * Note frequencies (A4 = 440 Hz)
 */
const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const A4_FREQUENCY = 440;
const A4_NOTE_INDEX = 9; // A is at index 9 in NOTES array

/**
 * Convert frequency to MIDI note number
 */
export function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / A4_FREQUENCY) + 69);
}

/**
 * Convert MIDI note number to frequency
 */
export function midiToFrequency(midiNote: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Convert frequency to note name and octave
 */
export function frequencyToNote(frequency: number): string {
  const midiNote = frequencyToMidi(frequency);
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return `${NOTES[noteIndex]}${octave}`;
}

/**
 * Calculate cents deviation from nearest note
 */
export function frequencyToCents(frequency: number): number {
  const midiNote = frequencyToMidi(frequency);
  const nearestMidiNote = Math.round(midiNote);
  const expectedFrequency = midiToFrequency(nearestMidiNote);
  return 1200 * Math.log2(frequency / expectedFrequency);
}

/**
 * Autocorrelation function for pitch detection
 * Returns the lag at which the signal correlates best with itself
 */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  // Implements the autocorrelation algorithm
  // Find the size of the buffer
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);

  let best_offset = -1;
  let best_correlation = 0;
  let rms = 0;

  // Calculate RMS (root mean square) to check if there's enough signal
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Not enough signal
  if (rms < 0.01) return -1;

  // Find the best correlation offset
  let lastCorrelation = 1;
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }

    correlation = 1 - correlation / MAX_SAMPLES;
    if (correlation > 0.9 && correlation > lastCorrelation) {
      let foundGoodCorrelation = false;

      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
        foundGoodCorrelation = true;
      }

      if (foundGoodCorrelation) {
        // Interpolate to get a more accurate offset
        const shift =
          (buffer[best_offset + 1] - buffer[best_offset - 1]) /
          (2 * (2 * buffer[best_offset] - buffer[best_offset - 1] - buffer[best_offset + 1]));
        return sampleRate / (best_offset + shift);
      }
    }

    lastCorrelation = correlation;
  }

  if (best_correlation > 0.01) {
    return sampleRate / best_offset;
  }

  return -1;
}

/**
 * Audio Analyzer class for real-time pitch detection
 */
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private floatData: Float32Array | null = null;
  private smoothedFrequency: number = 0;
  private smoothingFactor: number = 0.3;
  private minFrequency: number = 80; // Hz (below human voice range)
  private maxFrequency: number = 400; // Hz (above typical human voice range)
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private onPitchUpdate: ((pitch: PitchData) => void) | null = null;

  constructor(config: AudioAnalyzerConfig = {}) {
    this.smoothingFactor = config.smoothingFactor || 0.3;
    this.minFrequency = config.minFrequency || 80;
    this.maxFrequency = config.maxFrequency || 400;
  }

  /**
   * Initialize the audio analyzer with microphone stream
   */
  async initialize(stream: MediaStream): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;

    this.mediaStreamSource.connect(this.analyser);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as any;
    this.floatData = new Float32Array(this.analyser.fftSize);
  }

  /**
   * Start analyzing pitch in real-time
   */
  start(onPitchUpdate: (pitch: PitchData) => void): void {
    if (!this.analyser || !this.floatData) {
      console.error("Analyzer not initialized");
      return;
    }

    this.isRunning = true;
    this.onPitchUpdate = onPitchUpdate;
    this.analyze();
  }

  /**
   * Stop analyzing pitch
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Analyze audio data and detect pitch
   */
  private analyze(): void {
    if (!this.isRunning || !this.analyser || !this.floatData || !this.onPitchUpdate) {
      return;
    }

    // Get time-domain data
    this.analyser.getFloatTimeDomainData(this.floatData as any);

    // Detect pitch using autocorrelation
    const frequency = autoCorrelate(this.floatData as any, this.audioContext!.sampleRate);

    // Get amplitude
    this.analyser.getByteFrequencyData(this.dataArray! as any);
    const amplitude = this.getAmplitude();

    // Process detected frequency
    if (frequency > 0 && frequency >= this.minFrequency && frequency <= this.maxFrequency) {
      // Apply smoothing to reduce jitter
      this.smoothedFrequency =
        this.smoothedFrequency * (1 - this.smoothingFactor) +
        frequency * this.smoothingFactor;

      const pitchData: PitchData = {
        frequency: this.smoothedFrequency,
        note: frequencyToNote(this.smoothedFrequency),
        cents: frequencyToCents(this.smoothedFrequency),
        confidence: this.calculateConfidence(this.floatData),
        amplitude: amplitude,
      };

      this.onPitchUpdate(pitchData);
    } else {
      // No valid pitch detected
      const pitchData: PitchData = {
        frequency: 0,
        note: "---",
        cents: 0,
        confidence: 0,
        amplitude: amplitude,
      };

      this.onPitchUpdate(pitchData);
    }

    this.animationFrameId = requestAnimationFrame(() => this.analyze());
  }

  /**
   * Calculate confidence in pitch detection (0-1)
   */
  private calculateConfidence(buffer: Float32Array | Uint8Array): number {
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);

    // Confidence increases with signal strength
    // Clamp between 0 and 1
    return Math.min(1, Math.max(0, (rms - 0.01) / 0.1));
  }

  /**
   * Get amplitude from frequency data
   */
  private getAmplitude(): number {
    if (!this.dataArray) return 0;

    let sum = 0;
    const length = this.dataArray.length;
    for (let i = 0; i < length; i++) {
      sum += (this.dataArray as any)[i];
    }

    return sum / (length * 255);
  }

  /**
   * Close the audio analyzer and clean up resources
   */
  close(): void {
    this.stop();

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }

    if (this.analyser) {
      this.analyser.disconnect();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.analyser = null;
    this.mediaStreamSource = null;
    this.dataArray = null;
    this.floatData = null;
  }
}

/**
 * Compare two pitches and calculate accuracy
 */
export function comparePitches(
  userPitch: number,
  expectedPitch: number,
  toleranceCents: number = 50
): number {
  if (userPitch === 0 || expectedPitch === 0) return 0;

  const userMidi = frequencyToMidi(userPitch);
  const expectedMidi = frequencyToMidi(expectedPitch);

  const difference = Math.abs(userMidi - expectedMidi) * 100;

  if (difference > toleranceCents) return 0;

  return (1 - difference / toleranceCents) * 100;
}

/**
 * Calculate overall singing score based on pitch accuracy
 */
export function calculateSingingScore(accuracies: number[]): number {
  if (accuracies.length === 0) return 0;

  const average = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  return Math.round(average);
}
