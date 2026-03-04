import { useEffect, useRef } from "react";
import { PitchData } from "@/lib/pitchDetection";

interface PitchVisualizerProps {
  pitchData: PitchData | null;
  targetNote?: string;
  width?: number;
  height?: number;
}

export default function PitchVisualizer({
  pitchData,
  targetNote,
  width = 300,
  height = 200,
}: PitchVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pitchData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw tolerance zones (±50 cents)
    ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
    ctx.fillRect(0, height / 2 - 50, width, 100);

    // Draw pitch indicator
    const maxCents = 100;
    const yPosition = height / 2 - (pitchData.cents / maxCents) * (height / 2);

    // Draw pitch circle
    const radius = 8;
    const hue = pitchData.cents > 0 ? 0 : 240; // Red if sharp, blue if flat
    const saturation = Math.min(100, Math.abs(pitchData.cents));

    ctx.fillStyle = `hsl(${hue}, ${saturation}%, 50%)`;
    ctx.beginPath();
    ctx.arc(width / 2, yPosition, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw confidence indicator
    ctx.strokeStyle = `rgba(0, 0, 0, ${pitchData.confidence})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, yPosition, radius + 5, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw note labels
    ctx.fillStyle = "#374151";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("+50¢", 10, 20);
    ctx.fillText("0¢", 10, height / 2 + 5);
    ctx.fillText("-50¢", 10, height - 10);

    // Draw current note
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = pitchData.frequency > 0 ? "#1f2937" : "#9ca3af";
    ctx.fillText(pitchData.note, width / 2, height - 30);

    // Draw frequency
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(
      pitchData.frequency > 0 ? `${pitchData.frequency.toFixed(1)} Hz` : "No pitch detected",
      width / 2,
      height - 10
    );
  }, [pitchData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border-2 border-purple-200 dark:border-purple-700 rounded-lg bg-gray-50 dark:bg-gray-900"
    />
  );
}
