import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, Play, Pause, Volume2, Mic2, Loader2, StopCircle } from "lucide-react";
import { msToTime } from "@/lib/lrcParser";
import { AudioAnalyzer, PitchData, calculateSingingScore } from "@/lib/pitchDetection";

type ScoreSummary = {
  score: number;
  sampleCount: number;
  avgConfidence: number;
  avgAmplitude: number;
};

export default function Player() {
  const { songId } = useParams<{ songId: string }>();
  const [, setLocation] = useLocation();
  const mediaRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pitchAccuraciesRef = useRef<number[]>([]);
  const pitchConfidenceRef = useRef<number[]>([]);
  const pitchAmplitudeRef = useRef<number[]>([]);
  const controlsHideTimeoutRef = useRef<number | null>(null);

  // Fetch song data
  const { data: song, isLoading: isLoadingSong } = trpc.songs.getById.useQuery({
    id: Number.parseInt(songId || "0"),
  });

  const resetScoring = () => {
    pitchAccuraciesRef.current = [];
    pitchConfidenceRef.current = [];
    pitchAmplitudeRef.current = [];
  };

  const stopMicrophone = (shouldFinalizeScore: boolean) => {
    if (analyzerRef.current) {
      analyzerRef.current.stop();
      analyzerRef.current.close();
      analyzerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsMicrophoneActive(false);

    if (shouldFinalizeScore) {
      finalizeScoring();
    }
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const analyzer = new AudioAnalyzer({
        minFrequency: 80,
        maxFrequency: 400,
        smoothingFactor: 0.3,
      });

      await analyzer.initialize(stream);
      analyzerRef.current = analyzer;

      analyzer.start((pitch) => {
        collectPitchSample(pitch);
      });

      setIsMicrophoneActive(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      setIsMicrophoneActive(false);
    }
  };

  const collectPitchSample = (pitch: PitchData) => {
    if (pitch.frequency <= 0 || pitch.confidence < 0.2) {
      return;
    }

    const centsError = Math.min(100, Math.abs(pitch.cents));
    const accuracy = Math.max(0, 100 - centsError);

    pitchAccuraciesRef.current.push(accuracy);
    pitchConfidenceRef.current.push(Math.round(pitch.confidence * 100));
    pitchAmplitudeRef.current.push(Math.round(pitch.amplitude * 100));
  };

  const finalizeScoring = (): ScoreSummary => {
    const accuracies = pitchAccuraciesRef.current;
    if (accuracies.length === 0) {
      return {
        score: 0,
        sampleCount: 0,
        avgConfidence: 0,
        avgAmplitude: 0,
      };
    }

    const score = calculateSingingScore(accuracies);
    const avgConfidence = Math.round(
      pitchConfidenceRef.current.reduce((sum, value) => sum + value, 0) /
        pitchConfidenceRef.current.length
    );
    const avgAmplitude = Math.round(
      pitchAmplitudeRef.current.reduce((sum, value) => sum + value, 0) /
        pitchAmplitudeRef.current.length
    );

    return {
      score,
      sampleCount: accuracies.length,
      avgConfidence,
      avgAmplitude,
    };
  };

  const goToScoreDashboard = (summary: ScoreSummary) => {
    const params = new URLSearchParams({
      score: String(summary.score),
      samples: String(summary.sampleCount),
      confidence: String(summary.avgConfidence),
      volume: String(summary.avgAmplitude),
      songTitle: song?.title ?? "",
      songArtist: song?.artist ?? "",
    });

    setLocation(`/score?${params.toString()}`);
  };

  const startPerformanceSession = async () => {
    if (hasSessionStarted || !mediaRef.current) {
      return;
    }

    resetScoring();

    try {
      await mediaRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Autoplay blocked:", error);
      return;
    }

    await startMicrophone();
    setHasSessionStarted(true);
  };

  const clearControlsHideTimeout = () => {
    if (controlsHideTimeoutRef.current !== null) {
      globalThis.clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
  };

  const armControlsAutoHide = () => {
    clearControlsHideTimeout();

    if (!isPlaying) {
      return;
    }

    controlsHideTimeoutRef.current = globalThis.setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const revealControls = () => {
    setShowControls(true);
    armControlsAutoHide();
  };

  useEffect(() => {
    setHasSessionStarted(false);
    resetScoring();
    setShowControls(true);
  }, [song?.instrumentalUrl]);

  useEffect(() => {
    if (isPlaying) {
      armControlsAutoHide();
    } else {
      clearControlsHideTimeout();
      setShowControls(true);
    }

    return () => clearControlsHideTimeout();
  }, [isPlaying]);

  // Handle audio events
  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        if (!isMicrophoneActive) {
          resetScoring();
        }
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      void startPerformanceSession();
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
  };

  const handleMicrophoneToggle = async () => {
    if (isMicrophoneActive) {
      stopMicrophone(true);
    } else {
      await startMicrophone();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearControlsHideTimeout();

      if (analyzerRef.current) {
        analyzerRef.current.stop();
        analyzerRef.current.close();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (isLoadingSong) {
    return (
      <div className="min-h-screen vivioke-party-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen vivioke-party-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Música não encontrada</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vivioke-party-bg relative overflow-hidden">
      {/* Media Element */}
      <video
        ref={mediaRef}
        src={song.instrumentalUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          const summary = finalizeScoring();
          stopMicrophone(false);
          goToScoreDashboard(summary);
        }}
        onMouseMove={revealControls}
        onTouchStart={revealControls}
        preload="metadata"
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-[center_88%] bg-black"
      >
        <track
          kind="captions"
          srcLang="pt"
          label="Português"
          src="data:text/vtt,WEBVTT"
          default
        />
      </video>

      <div className="pointer-events-none absolute inset-0 z-10 vivioke-party-overlay" />

      {/* Header */}
      <div
        className={`absolute top-4 left-4 z-30 transition-opacity duration-200 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Link href="/songs">
          <Button variant="ghost" size="sm" className="bg-black/60 text-white hover:bg-black/80">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Top Controls Overlay */}
      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[min(88vw,500px)] transition-opacity duration-200 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Card className="border-0 bg-black/45 backdrop-blur-sm p-2.5">
          <div className="mb-2">
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={duration || 100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-white/75 mt-1">
              <span>{msToTime(currentTime * 1000)}</span>
              <span>{msToTime(duration * 1000)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <Button
              size="sm"
              onClick={handlePlayPause}
              className="vivioke-cta hover:brightness-110 text-white font-bold rounded-full w-9 h-9"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </Button>

            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1">
              <Volume2 className="w-3 h-3 text-white" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-16"
              />
            </div>

            <Button
              size="sm"
              onClick={handleMicrophoneToggle}
              variant={isMicrophoneActive ? "default" : "outline"}
              className={`rounded-full ${
                isMicrophoneActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "border-2 border-purple-400 text-white hover:bg-white/10"
              } w-9 h-9`}
            >
              {isMicrophoneActive ? <StopCircle className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
