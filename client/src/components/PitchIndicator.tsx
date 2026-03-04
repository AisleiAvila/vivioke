import { PitchData } from "@/lib/pitchDetection";
import { Mic2, AlertCircle, CheckCircle2 } from "lucide-react";

interface PitchIndicatorProps {
  pitchData: PitchData | null;
  isRecording: boolean;
}

export default function PitchIndicator({ pitchData, isRecording }: Readonly<PitchIndicatorProps>) {
  if (!isRecording) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
        <Mic2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Clique no microfone para começar</p>
      </div>
    );
  }

  if (!pitchData) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
        <Mic2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Aguardando som...</p>
      </div>
    );
  }

  if (pitchData.frequency <= 0) {
    return null;
  }

  const isInTune = Math.abs(pitchData.cents) <= 50;
  const isSharp = pitchData.cents > 0;
  const isFlat = pitchData.cents < 0;
  let tuningLabel = "↓ Muito grave";
  let markerColorClass = "bg-blue-500";
  let centsDirectionLabel = "no alvo";

  if (isInTune) {
    tuningLabel = "✓ Afinado!";
    markerColorClass = "bg-green-500";
  } else if (isSharp) {
    tuningLabel = "↑ Muito agudo";
    markerColorClass = "bg-red-500";
    centsDirectionLabel = "acima";
  } else if (isFlat) {
    centsDirectionLabel = "abaixo";
  }

  return (
    <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg p-6 text-center">
      <div className="mb-4 flex items-center justify-center gap-2">
        {isInTune ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <AlertCircle className="w-6 h-6 text-yellow-500" />
        )}
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tom Detectado</span>
      </div>

      <div className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">
        {pitchData.note}
      </div>
      <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">
        {pitchData.frequency.toFixed(1)} Hz
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {tuningLabel}
        </div>

        <div className="relative h-8 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1/3 h-full bg-green-400 opacity-30"></div>
          </div>

          <div
            className={`absolute top-0 h-full w-1 transition-all ${markerColorClass}`}
            style={{
              left: `${Math.max(0, Math.min(100, 50 + (pitchData.cents / 100) * 50))}%`,
            }}
          ></div>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-300">
          {Math.abs(pitchData.cents).toFixed(1)}¢ {centsDirectionLabel}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <div className="text-gray-600 dark:text-gray-400">Confiança</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {Math.round(pitchData.confidence * 100)}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <div className="text-gray-600 dark:text-gray-400">Volume</div>
          <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
            {Math.round(pitchData.amplitude * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
