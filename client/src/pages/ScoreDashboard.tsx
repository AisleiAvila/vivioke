import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

type ScoreData = {
  score: number;
  samples: number;
  confidence: number;
  volume: number;
  songTitle: string;
  songArtist: string;
};

const RESULT_EMOJIS = ["🎉", "🎊", "🎈", "🎵", "🎶", "✨", "🥳"];

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

export default function ScoreDashboard() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const scoreData = useMemo(parseScoreData, []);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setLocation("/songs");
    }, 5000);

    const intervalId = globalThis.setInterval(() => {
      setCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => {
      globalThis.clearTimeout(timeoutId);
      globalThis.clearInterval(intervalId);
    };
  }, [setLocation]);

  const scoreLabel = getScoreLabel(scoreData.score);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-purple-900 dark:to-blue-950 py-8 px-4">
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
        <Card className="border-2 border-purple-200 dark:border-purple-700 bg-white/90 dark:bg-purple-900/80 backdrop-blur-sm shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-300 dark:via-pink-300 dark:to-blue-300 bg-clip-text text-transparent mb-3">
              Resultado da Performance
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              {scoreData.songTitle || "Música"}
              {scoreData.songArtist ? ` · ${scoreData.songArtist}` : ""}
            </p>
          </div>

          <div className="text-center mb-8">
            <div className="text-7xl md:text-8xl font-black text-purple-700 dark:text-purple-200 leading-none">
              {scoreData.score}
            </div>
            <p className="text-xl font-bold text-pink-600 dark:text-pink-300 mt-2">{scoreLabel}</p>
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

          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Retornando para a lista em {countdown}s...
          </div>
        </Card>
      </div>
    </div>
  );
}
