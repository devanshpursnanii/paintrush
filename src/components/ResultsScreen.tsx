/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Palette, Award, Sparkles, Download, RefreshCw, Home, Binary, AlertCircle } from "lucide-react";
import { Painting, ScoreBreakdown } from "../types";
import { getPaintingSrc } from "../data/paintings.ts";

interface ResultsScreenProps {
  painting: Painting;
  userCanvasElement: HTMLCanvasElement | null;
  scoreBreakdown: ScoreBreakdown;
  userEdgesBase64: string;
  refEdgesBase64: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function ResultsScreen({
  painting,
  userCanvasElement,
  scoreBreakdown,
  userEdgesBase64,
  refEdgesBase64,
  onPlayAgain,
  onGoHome
}: ResultsScreenProps) {
  const [downloading, setDownloading] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const cardDataUrlRef = useRef<string | null>(null);

  // Generate the Masterpiece Certificate Card in-browser using HTML5 Canvas
  useEffect(() => {
    if (!userCanvasElement) return;

    const generateCard = async () => {
      try {
        const width = 800;
        const height = 600;

        const offscreen = document.createElement("canvas");
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext("2d")!;

        // 1. Sleek luxury dark-slate background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#0b0f19");
        grad.addColorStop(1, "#1e293b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Classy golden filigree borders
        ctx.lineWidth = 14;
        ctx.strokeStyle = "#e2b43b"; // Luxurious gold
        ctx.strokeRect(7, 7, width - 14, height - 14);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#d4af37";
        ctx.strokeRect(18, 18, width - 36, height - 36);

        // Corner decorative shapes
        ctx.fillStyle = "#e2b43b";
        ctx.fillRect(18, 18, 30, 30);
        ctx.fillRect(width - 48, 18, 30, 30);
        ctx.fillRect(18, height - 48, 30, 30);
        ctx.fillRect(width - 48, height - 48, 30, 30);

        // 3. Header Texts
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "bold 26px serif";
        ctx.fillText("PAINTRUSH ARTISTRY CERTIFICATE", width / 2, 60);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.fillText("AUTHENTIC ATTESTATION OF SPEED-PAINTING RECREATION", width / 2, 85);

        // Gold separator
        ctx.beginPath();
        ctx.moveTo(250, 100);
        ctx.lineTo(550, 100);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Draw Side-by-Side images (Reference on left, User on right)
        const frameW = 200;
        const frameH = 200;
        const yCoord = 140;
        const refX = 140;
        const userX = 460;

        // Draw Reference Image
        const refSrc = getPaintingSrc(painting);
        const refImg = new Image();
        refImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          refImg.onload = () => {
            // Background card for reference
            ctx.fillStyle = "#0c111e";
            ctx.fillRect(refX - 8, yCoord - 8, frameW + 16, frameH + 16);
            ctx.strokeStyle = "#d4af37";
            ctx.lineWidth = 3;
            ctx.strokeRect(refX - 8, yCoord - 8, frameW + 16, frameH + 16);

            // Draw image
            ctx.drawImage(refImg, refX, yCoord, frameW, frameH);
            resolve();
          };
          refImg.onerror = () => {
            // Draw placeholder if error
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(refX, yCoord, frameW, frameH);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText(painting.name, refX + frameW / 2, yCoord + frameH / 2);
            resolve();
          };
          refImg.src = refSrc;
        });

        // Draw User Drawing Canvas
        ctx.fillStyle = "#0c111e";
        ctx.fillRect(userX - 8, yCoord - 8, frameW + 16, frameH + 16);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(userX - 8, yCoord - 8, frameW + 16, frameH + 16);
        ctx.drawImage(userCanvasElement, userX, yCoord, frameW, frameH);

        // Labels underneath photos
        ctx.fillStyle = "#e2b43b";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("ORIGINAL MASTERPIECE", refX + frameW / 2, yCoord + frameH + 28);

        ctx.fillStyle = "#93c5fd";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("YOUR SPEED RECREATION", userX + frameW / 2, yCoord + frameH + 28);

        // 5. Drawing core metadata metrics
        const dataY = 410;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(50, dataY, width - 100, 140);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.strokeRect(50, dataY, width - 100, 140);

        // Painting info
        ctx.textAlign = "left";
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(`Artwork: ${painting.name}`, 80, dataY + 35);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.fillText(`Artist: ${painting.artist} (${painting.year})`, 80, dataY + 58);
        ctx.fillText(`Artistic Style: ${painting.style}`, 80, dataY + 81);
        ctx.fillText(`Difficulty Index: ${painting.difficulty}`, 80, dataY + 104);

        // Draw overall score
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15"; // Yellow-400
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(`${scoreBreakdown.totalScore.toFixed(1)}`, width - 160, dataY + 60);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("OVERALL GRADE", width - 160, dataY + 84);

        ctx.fillStyle = "#475569";
        ctx.font = "11px sans-serif";
        ctx.fillText("/ 10.0 POINTS Max", width - 160, dataY + 102);

        // Category Badge Overlay
        ctx.fillStyle = "#10b981"; // Emerald-500
        ctx.beginPath();
        ctx.arc(width - 160, dataY + 115, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(scoreBreakdown.categoryLabel.toUpperCase(), width - 160, dataY + 120);

        // 6. Detailed scores (SSIM, Color, Edges)
        ctx.textAlign = "center";
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`SSIM Score: ${scoreBreakdown.ssimScore}/10`, width / 2, dataY + 35);
        ctx.fillText(`Color Match: ${scoreBreakdown.colorScore}/10`, width / 2, dataY + 65);
        ctx.fillText(`Edge Overlay: ${scoreBreakdown.edgeScore}/10`, width / 2, dataY + 95);

        // Progress lines for each score
        const drawMiniBar = (cx: number, cy: number, val: number, color: string) => {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(cx - 50, cy, 100, 4);
          ctx.fillStyle = color;
          ctx.fillRect(cx - 50, cy, val * 10, 4);
        };
        drawMiniBar(width / 2, dataY + 42, scoreBreakdown.ssimScore, "#fbbf24");
        drawMiniBar(width / 2, dataY + 72, scoreBreakdown.colorScore, "#60a5fa");
        drawMiniBar(width / 2, dataY + 102, scoreBreakdown.edgeScore, "#ec4899");

        // Save total dataURL
        cardDataUrlRef.current = offscreen.toDataURL("image/png");
        setCardReady(true);
      } catch (err) {
        console.error("Failed to generate artistry card:", err);
      }
    };

    const timer = setTimeout(generateCard, 400);
    return () => clearTimeout(timer);
  }, [userCanvasElement, painting, scoreBreakdown]);

  // Initiate certificate download
  const handleDownloadCard = () => {
    if (!cardDataUrlRef.current) return;
    setDownloading(true);

    const link = document.createElement("a");
    link.href = cardDataUrlRef.current;
    link.download = `PaintRush_ArtistryCard_${painting.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="w-full max-w-7xl mx-auto text-[#1C1C1C] px-3 py-1 bg-[#FDFCF8] h-[calc(100vh-62px)] flex flex-col justify-between overflow-hidden select-none" id="results-workspace">
      {/* Primary Board Bento Grid - strictly bound to maximize space, zero scroll */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 items-stretch overflow-hidden" id="results-bento-grid">
        
        {/* Left column (8 cols wide on lg): Score display & comparative images */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0 h-full overflow-hidden">
          
          {/* Card 1: Score breakdown curator review card. Height: 30% */}
          <div className="p-3.5 bg-white border-4 border-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] rounded-none text-black flex flex-col justify-center h-[30%] min-h-0 shrink-0" id="master-grade-card">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center h-full">
              {/* Radial/Box Grade indication on Left */}
              <div className="md:col-span-4 flex flex-col items-center justify-center py-2 px-3 border-4 border-[#1C1C1C] bg-[#FFD700] text-black shadow-[2px_2px_0px_0px_#1C1C1C] rounded-none text-center h-full justify-center">
                <div className="text-4xl font-sans font-black tracking-tighter text-[#1C1C1C] leading-none">
                  {scoreBreakdown.totalScore.toFixed(1)}
                </div>
                <div className="text-[#1C1C1C]/80 font-mono text-[9px] tracking-wider mt-1 uppercase font-black leading-none">Overall Score</div>
                <span className="mt-1.5 px-3 py-0.5 bg-[#FF4500] text-white text-[9px] font-black border border-black tracking-wide uppercase select-none shadow-[1px_1px_0px_0px_#1C1C1C] truncate max-w-full">
                  {scoreBreakdown.categoryLabel}
                </span>
              </div>

              {/* Text review description on right */}
              <div className="md:col-span-8 space-y-1 text-left flex flex-col justify-center">
                <span className="inline-flex gap-1 items-center text-[9px] font-mono text-[#FF4500] font-black uppercase tracking-wider leading-none">
                  <Sparkles className="w-3 h-3" />
                  <span>Gallery Curator Review</span>
                </span>
                <p className="text-[#1C1C1C] text-sm md:text-base font-black leading-snug line-clamp-2">
                  "{scoreBreakdown.description}"
                </p>
                <div className="h-px bg-black opacity-10 my-1" />
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-black leading-tight">
                  <div>
                    <span className="block text-[8px] text-black/50 uppercase tracking-widest font-black">Artwork Recreated</span>
                    <span className="text-black font-extrabold block truncate pr-1">{painting.name}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-black/50 uppercase tracking-widest font-black">Original Style</span>
                    <span className="text-black font-extrabold block truncate pr-1">{painting.style}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Combined Form & Overlay Comparison (4 visual blocks side-by-side). Height: 68% */}
          <div className="p-3 bg-white border-4 border-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] rounded-none text-black flex flex-col h-[67%] min-h-0 overflow-hidden" id="visual-double-panel">
            <h3 className="text-[11px] font-black text-black uppercase tracking-tight flex items-center gap-1 border-b border-black/10 pb-1.5 shrink-0">
              <Palette className="w-4 h-4 text-[#FF4500]" />
              <span>Comparative Form & Structural Edge Profiles</span>
            </h3>

            {/* 4 Items Grid */}
            <div className="grid grid-cols-4 gap-2.5 flex-1 min-h-0 items-center mt-2">
              {/* 1. Original painting */}
              <div className="flex flex-col h-full justify-between min-h-0">
                <div className="relative aspect-square border-2 border-[#1C1C1C] bg-black p-0.5 rounded-none overflow-hidden flex items-center justify-center flex-grow min-h-0">
                  <img
                    src={getPaintingSrc(painting)}
                    alt={painting.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-white border border-[#1C1C1C] text-[8px] font-black uppercase tracking-wider text-black">
                    Ref Image
                  </div>
                </div>
                <div className="text-center font-sans mt-1 shrink-0">
                  <h4 className="text-[9px] font-black text-black truncate leading-none">{painting.name}</h4>
                  <p className="text-[8px] text-black/60 font-semibold truncate mt-0.5">{painting.artist}</p>
                </div>
              </div>

              {/* 2. User Drawing */}
              <div className="flex flex-col h-full justify-between min-h-0">
                <div className="relative aspect-square border-2 border-dashed border-[#1C1C1C] bg-white p-0.5 rounded-none overflow-hidden flex items-center justify-center flex-grow min-h-0">
                  {userCanvasElement ? (
                    <img
                      src={userCanvasElement.toDataURL("image/png")}
                      alt="Your drawing"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 text-[9px] font-bold">Failed</div>
                  )}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#FFD700] border border-[#1C1C1C] text-[8px] font-black uppercase tracking-wider text-black">
                    Your Paint
                  </div>
                </div>
                <div className="text-center font-sans mt-1 shrink-0">
                  <h4 className="text-[9px] font-black text-black truncate leading-none">Reproduction</h4>
                  <p className="text-[8px] text-black/60 font-semibold truncate mt-0.5">2:00 mins limit</p>
                </div>
              </div>

              {/* 3. Reference Edge Skeleton */}
              <div className="flex flex-col h-full justify-between min-h-0">
                <div className="relative aspect-square border-2 border-[#1C1C1C] bg-black rounded-none overflow-hidden flex items-center justify-center flex-grow min-h-0">
                  <img
                    src={refEdgesBase64}
                    alt="Master drawing contour vectors"
                    className="w-full h-full object-contain filter hue-rotate-15 animate-pulse"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-pink-600 text-[8px] text-white font-mono font-black border border-black leading-none">
                    Master Outline
                  </div>
                </div>
                <div className="text-center font-sans mt-1 shrink-0">
                  <h4 className="text-[9px] font-black text-black truncate leading-none">Canny Edges</h4>
                  <p className="text-[8px] text-pink-500 font-mono font-black leading-none mt-0.5">Magenta Profile</p>
                </div>
              </div>

              {/* 4. User Edge Skeleton */}
              <div className="flex flex-col h-full justify-between min-h-0">
                <div className="relative aspect-square border-2 border-[#1C1C1C] bg-black rounded-none overflow-hidden flex items-center justify-center flex-grow min-h-0">
                  <img
                    src={userEdgesBase64}
                    alt="User drawing contour vectors"
                    className="w-full h-full object-contain filter hue-rotate-15"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-cyan-400 text-[8px] text-black font-mono font-black border border-black leading-none">
                    Your Outline
                  </div>
                </div>
                <div className="text-center font-sans mt-1 shrink-0">
                  <h4 className="text-[9px] font-black text-black truncate leading-none">Trace Analysis</h4>
                  <p className="text-[8px] text-cyan-600 font-mono font-black leading-none mt-0.5">Cyan Profile</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right column (4 cols wide on lg): Metrics details & Game controls */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 h-full overflow-hidden justify-between" id="technical-panel">
          
          {/* Card 3: Compact Scorecard parameters. Height: 46% */}
          <div className="p-3 bg-[#F0E6D2] border-4 border-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] rounded-none text-black flex flex-col justify-between h-[47%] min-h-0 overflow-hidden" id="metrics-card">
            <h3 className="text-[11px] uppercase tracking-wider font-mono font-black text-black border-b border-black/10 pb-1 shrink-0 leading-none">
              Metrics Scorecard
            </h3>

            {/* Metric 1: SSIM */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black leading-none">
                <span>Structural Match (SSIM)</span>
                <span className="font-mono text-black">{scoreBreakdown.ssimScore.toFixed(1)}/10</span>
              </div>
              <div className="w-full h-2.5 bg-white border border-black rounded-none overflow-hidden">
                <div
                  className="h-full bg-[#FF4500]"
                  style={{ width: `${scoreBreakdown.ssimScore * 10}%` }}
                />
              </div>
              <p className="text-[9px] text-black/75 leading-tight font-semibold line-clamp-1">
                Spatial contours and shape distributions similarity weight.
              </p>
            </div>

            {/* Metric 2: Color Histogram */}
            <div className="space-y-1 border-t border-black/10 pt-1">
              <div className="flex justify-between items-center text-[10px] font-black leading-none">
                <span>Color Histogram Engine</span>
                <span className="font-mono text-blue-800">{scoreBreakdown.colorScore.toFixed(1)}/10</span>
              </div>
              <div className="w-full h-2.5 bg-white border border-black rounded-none overflow-hidden">
                <div
                  className="h-full bg-cyan-600"
                  style={{ width: `${scoreBreakdown.colorScore * 10}%` }}
                />
              </div>
              <p className="text-[9px] text-black/75 leading-tight font-semibold line-clamp-1">
                RGB color overlap histogram matching ratio.
              </p>
            </div>

            {/* Metric 3: Edge Contour */}
            <div className="space-y-1 border-t border-black/10 pt-1">
              <div className="flex justify-between items-center text-[10px] font-black leading-none">
                <span>Skeletal Trace Match</span>
                <span className="font-mono text-pink-600">{scoreBreakdown.edgeScore.toFixed(1)}/10</span>
              </div>
              <div className="w-full h-2.5 bg-white border border-black rounded-none overflow-hidden">
                <div
                  className="h-full bg-pink-600"
                  style={{ width: `${scoreBreakdown.edgeScore * 10}%` }}
                />
              </div>
              <p className="text-[9px] text-black/75 leading-tight font-semibold line-clamp-1">
                Precision-recall metrics of Sobel outline coincidence.
              </p>
            </div>

            {/* Info footnote */}
            <div className="flex gap-1.5 items-center p-1.5 bg-white border border-black rounded-none text-[8.5px] leading-tight shrink-0" id="evaluation-footnote">
              <AlertCircle className="w-3.5 h-3.5 text-black shrink-0" />
              <p className="text-black/80 font-semibold truncate">
                Evaluation weights: 50% SSIM, 30% Color, 20% Edges.
              </p>
            </div>
          </div>

          {/* Card 4: Art Certificate Card Triggers & Controls. Height: 50% */}
          <div className="p-3 bg-white border-4 border-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] rounded-none flex flex-col justify-between h-[49%] min-h-0 overflow-hidden" id="artistry-card-generator">
            <div className="text-center">
              <h4 className="text-[11px] font-black text-black flex justify-center items-center gap-1.5 uppercase tracking-wide leading-none">
                <Award className="w-4 h-4 text-[#FFD700]" />
                <span>Verification Certificate</span>
              </h4>
              <p className="text-[10px] text-black/75 font-semibold mt-1 leading-snug line-clamp-2">
                Generate a gorgeous high-resolution museum gallery credential with your artwork and rating!
              </p>
            </div>

            <button
              onClick={handleDownloadCard}
              disabled={!cardReady || downloading}
              className={`w-full py-2 bg-[#FFD700] text-black border-2 border-[#1C1C1C] shadow-[2px_2px_0px_0px_#1C1C1C] font-black uppercase text-[11px] tracking-tight transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1C1C1C] cursor-pointer rounded-none flex items-center justify-center gap-1.5`}
              id="btn-download-cert"
            >
              <Download className={`w-3.5 h-3.5 ${downloading ? "animate-bounce" : ""}`} />
              <span>{downloading ? "Downloading PNG..." : "Download Art Card"}</span>
            </button>

            {/* Navigator Controls */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={onPlayAgain}
                className="py-2.5 bg-[#FF4500] text-white border-2 border-[#1C1C1C] shadow-[2px_2px_0px_0px_#1C1C1C] font-black uppercase text-[10px] tracking-tight transition-all active:translate-x-[1px] active:translate-y-[1px] active:scale-[0.98] cursor-pointer rounded-none flex items-center justify-center gap-1.5"
                id="btn-play-again"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>Sprinting Again</span>
              </button>

              <button
                onClick={onGoHome}
                className="py-2.5 bg-white text-[#1C1C1C] border-2 border-[#1C1C1C] shadow-[2px_2px_0px_0px_#1C1C1C] font-black uppercase text-[10px] tracking-tight transition-all active:translate-x-[1px] active:translate-y-[1px] active:scale-[0.98] cursor-pointer rounded-none flex items-center justify-center gap-1.5"
                id="btn-nav-home"
              >
                <Home className="w-3.5 h-3.5 text-[#1C1C1C] stroke-[2.5]" />
                <span>Gallery Lobby</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
