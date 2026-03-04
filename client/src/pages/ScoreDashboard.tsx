import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";

type ScoreData = {
  score: number;
  samples: number;
  confidence: number;
  volume: number;
  songTitle: string;
  songArtist: string;
};

const RESULT_EMOJIS = ["🎉", "🎊", "🎈", "🎵", "🎶", "✨", "🥳"];
const BEST_SCORE_KEY = "vivioke-best-score";
const PARTY_MODE_DURATION_MS = 4600;
const LIGHT_BURST_BASE = [
  { size: 240, delay: 0, color: "bg-primary/40" },
  { size: 360, delay: 0.1, color: "bg-secondary/35" },
  { size: 500, delay: 0.2, color: "bg-accent/28" },
];

function getConfettiColorClass(index: number) {
  const palette = ["bg-primary", "bg-secondary", "bg-accent", "bg-chart-4", "bg-chart-5"];
  return palette[index % palette.length];
}

const CONFETTI_BASE = Array.from({ length: 44 }, (_, index) => ({
  id: index,
  left: `${(index * 9) % 100}%`,
  delay: (index % 11) * 0.06,
  duration: 2.1 + (index % 7) * 0.18,
  rotate: (index % 2 === 0 ? 1 : -1) * (90 + index * 8),
  colorClass: getConfettiColorClass(index),
}));

const SPARKLE_BASE = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${6 + (index % 6) * 16}%`,
  top: `${10 + Math.floor(index / 6) * 28}%`,
  delay: (index % 7) * 0.12,
  size: index % 3 === 0 ? 7 : 5,
}));

function parseScoreData(): ScoreData {
  if (globalThis.window === undefined) {
    return {
      score: 0,
      samples: 0,
      confidence: 0,
      volume: 0,
      songTitle: "",
      songArtist: "",
    };
  }

  const params = new URLSearchParams(globalThis.location.search);

  return {
    score: Number.parseInt(params.get("score") ?? "0", 10) || 0,
    samples: Number.parseInt(params.get("samples") ?? "0", 10) || 0,
    confidence: Number.parseInt(params.get("confidence") ?? "0", 10) || 0,
    volume: Number.parseInt(params.get("volume") ?? "0", 10) || 0,
    songTitle: params.get("songTitle") ?? "",
    songArtist: params.get("songArtist") ?? "",
  };
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Muito bom";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Pode melhorar";
  return "Continue praticando";
}

type AudioContextWithWebkit = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function playCounterTick(audioContext: AudioContext) {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(1240, now);
  oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.045);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.08);
}

function createAudioContext() {
  if (globalThis.window === undefined) {
    return null;
  }

  const scopedWindow = globalThis as AudioContextWithWebkit;
  const Ctor = scopedWindow.AudioContext ?? scopedWindow.webkitAudioContext;

  if (!Ctor) {
    return null;
  }

  return new Ctor();
}

export default function ScoreDashboard() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [isRecord, setIsRecord] = useState(false);
  const [isPartyActive, setIsPartyActive] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);
  const scoreData = useMemo(parseScoreData, []);

  useEffect(() => {
    const previousBest = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? "0", 10) || 0;
    const hasRecord = scoreData.score > previousBest;
    if (hasRecord) {
      localStorage.setItem(BEST_SCORE_KEY, String(scoreData.score));
    }
    setIsRecord(hasRecord);
  }, [scoreData.score]);

  useEffect(() => {
    const finalScore = Math.max(0, scoreData.score);

    if (finalScore === 0) {
      setDisplayScore(0);
      return;
    }

    const audioContext = createAudioContext();
    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }

    const minTickMs = 14;
    const maxTickMs = 62;
    let currentValue = 0;
    let timeoutId: number | null = null;

    setDisplayScore(0);

    const scheduleNextTick = () => {
      currentValue += 1;
      setDisplayScore(currentValue);

      if (audioContext) {
        playCounterTick(audioContext);
      }

      if (currentValue >= finalScore) {
        return;
      }

      const progress = currentValue / finalScore;
      const dramaticProgress = progress * progress;
      const nextDelay = Math.round(minTickMs + (maxTickMs - minTickMs) * dramaticProgress);
      timeoutId = globalThis.setTimeout(scheduleNextTick, nextDelay);
    };

    timeoutId = globalThis.setTimeout(scheduleNextTick, minTickMs);

    return () => {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
      if (audioContext) {
        void audioContext.close();
      }
    };
  }, [scoreData.score]);

  useEffect(() => {
    const partyTimerId = globalThis.setTimeout(() => {
      setIsPartyActive(false);
    }, PARTY_MODE_DURATION_MS);

    const timeoutId = globalThis.setTimeout(() => {
      setLocation("/songs");
    }, 5000);

    const intervalId = globalThis.setInterval(() => {
      setCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => {
      globalThis.clearTimeout(partyTimerId);
      globalThis.clearTimeout(timeoutId);
      globalThis.clearInterval(intervalId);
    };
  }, [setLocation]);

  const scoreLabel = getScoreLabel(scoreData.score);
  let confettiParticles = [
    ...CONFETTI_BASE,
    ...CONFETTI_BASE.map((item) => ({
      ...item,
      id: item.id + 300,
      left: `${(Number.parseFloat(item.left) + 7) % 100}%`,
      delay: item.delay + 0.26,
      duration: item.duration + 0.22,
      rotate: item.rotate * -0.9,
    })),
  ];

  if (isRecord) {
    confettiParticles = [
      ...CONFETTI_BASE,
      ...CONFETTI_BASE.map((item) => ({
        ...item,
        id: item.id + 100,
        left: `${(Number.parseFloat(item.left) + 5) % 100}%`,
        delay: item.delay + 0.15,
        duration: item.duration + 0.2,
        rotate: item.rotate * -1,
      })),
      ...CONFETTI_BASE.map((item) => ({
        ...item,
        id: item.id + 200,
        left: `${(Number.parseFloat(item.left) + 11) % 100}%`,
        delay: item.delay + 0.38,
        duration: item.duration + 0.45,
        rotate: item.rotate * 1.25,
      })),
    ];
  }

  let burstLayers = [...LIGHT_BURST_BASE];
  if (isRecord) {
    burstLayers = [...LIGHT_BURST_BASE, { size: 620, delay: 0.28, color: "bg-chart-5/30" }];
  }

  let burstRepeatCount = 0;
  let sparkleRepeatCount = 0;
  let confettiRepeatCount = 0;

  if (isPartyActive) {
    if (isRecord) {
      burstRepeatCount = 3;
      sparkleRepeatCount = 6;
      confettiRepeatCount = 2;
    } else {
      burstRepeatCount = 2;
      sparkleRepeatCount = 4;
      confettiRepeatCount = 1;
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden vivioke-party-bg py-8 px-4">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence>
          {burstLayers.map((layer, index) => (
            <motion.div
              key={`burst-${layer.size}-${index}`}
              className={`absolute left-1/2 top-[46%] rounded-full blur-3xl ${layer.color}`}
              style={{ width: layer.size, height: layer.size, marginLeft: -layer.size / 2, marginTop: -layer.size / 2 }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 1, 0.35, 0], scale: [0.3, 1.12, 1.28, 1.55] }}
              transition={{
                duration: 1.45,
                delay: layer.delay,
                ease: "easeOut",
                repeat: burstRepeatCount,
                repeatDelay: isRecord ? 0.15 : 0.22,
              }}
            />
          ))}
        </AnimatePresence>

        {SPARKLE_BASE.map((sparkle) => (
          <motion.div
            key={`sparkle-${sparkle.id}`}
            className="absolute rounded-full bg-white/85 shadow-[0_0_24px_6px_rgba(255,255,255,0.45)]"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1.2, 0.5] }}
            transition={{
              duration: 0.85,
              delay: sparkle.delay,
              ease: "easeOut",
              repeat: sparkleRepeatCount,
              repeatDelay: 0.1,
            }}
          />
        ))}

        {confettiParticles.map((particle) => (
          <motion.div
            key={`confetti-${particle.id}`}
            className={`absolute top-[-14%] h-3.5 w-2.5 rounded-sm ${particle.colorClass}`}
            style={{ left: particle.left }}
            initial={{ opacity: 0, y: -40, rotate: 0, scale: 0.9 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 190, 410, 740],
              x: [0, (particle.id % 2 === 0 ? 1 : -1) * 26, (particle.id % 2 === 0 ? -1 : 1) * 18],
              rotate: [0, particle.rotate, particle.rotate * 1.9],
              scale: [0.9, 1.1, 0.95, 0.85],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeInOut",
              repeat: confettiRepeatCount,
              repeatDelay: isRecord ? 0.08 : 0.14,
            }}
          />
        ))}
      </div>

      {RESULT_EMOJIS.map((emoji, index) => (
        <div
          key={`${emoji}-${index}`}
          className="pointer-events-none absolute text-3xl md:text-5xl animate-bounce"
          style={{
            left: `${8 + (index % 4) * 22}%`,
            top: `${10 + Math.floor(index / 4) * 35}%`,
            animationDelay: `${index * 0.2}s`,
            animationDuration: `${1.6 + (index % 3) * 0.3}s`,
          }}
        >
          {emoji}
        </div>
      ))}

      <div className="max-w-3xl mx-auto relative z-10">
        <Card className="vivioke-surface shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black vivioke-title-gradient mb-3">
              Resultado da Performance
            </h1>
            <p className="text-foreground/85 text-lg">
              {scoreData.songTitle || "Música"}
              {scoreData.songArtist ? ` · ${scoreData.songArtist}` : ""}
            </p>
          </div>

          <div className="text-center mb-8">
            <div className="text-7xl md:text-8xl font-black text-primary leading-none">
              {displayScore}
            </div>
            <p className="text-xl font-bold text-secondary mt-2">{scoreLabel}</p>
            {isRecord ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-2 inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary"
              >
                Novo recorde pessoal ✨
              </motion.p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-purple-100 dark:bg-purple-800/60 p-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">Amostras</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">{scoreData.samples}</div>
            </div>
            <div className="rounded-xl bg-blue-100 dark:bg-blue-800/60 p-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">Confiança média</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{scoreData.confidence}%</div>
            </div>
            <div className="rounded-xl bg-pink-100 dark:bg-pink-800/60 p-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">Volume médio</div>
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-200">{scoreData.volume}%</div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Retornando para a lista em {countdown}s...
          </div>
        </Card>
      </div>
    </div>
  );
}
