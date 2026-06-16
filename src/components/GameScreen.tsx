/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Clock, Palette, Sliders } from "lucide-react";
import { Painting, ToolState, ScoreBreakdown } from "../types";
import { DrawingCanvas, DrawingCanvasHandle } from "./DrawingCanvas";
import { getPaintingSrc } from "../data/paintings.ts";
import { evaluateDrawing } from "../lib/cvEvaluation";

interface GameScreenProps {
  painting: Painting;
  onFinishGame: (
    canvasElement: HTMLCanvasElement | null,
    score: ScoreBreakdown,
    userEdgesB64: string,
    refEdgesB64: string
  ) => void;
  onTimerExpired: () => void; // Stage change callback
}

// Preset Master's Color Palette for quick, beautiful access (16 elements = clean 8x2 grid)
const presetColors = [
  { hex: "#0c1b40", name: "Starry Prussian Blue" },
  { hex: "#ebd28f", name: "Vincent's Ochre" },
  { hex: "#d32f2f", name: "Mondrian Red" },
  { hex: "#1565c0", name: "Cobalt Blue" },
  { hex: "#2e7d32", name: "Claude's Pond Green" },
  { hex: "#e5a383", name: "Renaissance Peach" },
  { hex: "#7b1fa2", name: "Midnight Violet" },
  { hex: "#ff7043", name: "Expressionist Orange" },
  { hex: "#008080", name: "Great Wave Teal" },
  { hex: "#ff69b4", name: "Hot Fauve Pink" },
  { hex: "#8b5a2b", name: "Terra Cotta Brown" },
  { hex: "#4a3c31", name: "Raw Umber Brown" },
  { hex: "#f08080", name: "Light Coral Pink" },
  { hex: "#ffffff", name: "Pure White" },
  { hex: "#000000", name: "Suprematist Black" },
  { hex: "#757575", name: "Ochre Gray" }
];

export default function GameScreen({ painting, onFinishGame, onTimerExpired }: GameScreenProps) {
  // Timer count starting at exactly 3 minutes (180 seconds)
  const [secondsLeft, setSecondsLeft] = useState(180);

  // Active Tool state
  const [toolState, setToolState] = useState<ToolState>({
    color: "#0c1b40", 
    brushSize: 10,
    opacity: 1.0,
    tool: "brush"
  });

  // Custom HSB/HSV state for Hue, Saturation, Brightness
  const [hsb, setHsb] = useState({ h: 220, s: 80, b: 50 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);

  // Format seconds to clock MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Timer loop
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleFinalizeEvaluation();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Sync state when custom Hue, Saturation, Brightness are adjusted
  // useEffect(() => {
  //   const { h, s, b } = hsb;
  //   // Map HSB/HSV back to dynamic CSS HSL
  //   const l = (b / 100) * (1 - s / 200) * 100;
  //   setToolState((prev) => ({
  //     ...prev,
  //     color: `hsl(${h}, ${s}%, ${l}%)`
  //   }));
  // }, [hsb]);

  // Color generator helper for real-time slider backgrounds
  const getHslString = (h: number, s: number, b: number): string => {
    const l = (b / 100) * (1 - s / 200) * 100;
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // Fast preset color selector application
  const applyPresetColor = (hex: string) => {
    setToolState((prev) => ({
      ...prev,
      color: hex,
    }));

    // Align custom HSB sliders back to preset's properties
    const parsed = hexToHsb(hex);
    if (parsed) {
      setHsb(parsed);
    }
  };

  // Hex back-converter
  const hexToHsb = (hex: string): { h: number; s: number; b: number } | null => {
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (clean.length !== 6) return null;

    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const bMax = parseInt(clean.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, bMax);
    const min = Math.min(r, g, bMax);
    const d = max - min;

    let h = 0;
    if (d === 0) h = 0;
    else if (max === r) h = ((g - bMax) / d) % 6;
    else if (max === g) h = (bMax - r) / d + 2;
    else h = (r - g) / d + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = Math.round(max === 0 ? 0 : (d / max) * 100);
    const b = Math.round(max * 100);

    return { h, s, b };
  };

  // Compute metrics and submit drawing
  const handleFinalizeEvaluation = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onTimerExpired(); // Change global stage to "evaluating" loader

    const canvas = canvasRef.current?.getCanvasElement();
    if (canvas) {
      const srcStr = getPaintingSrc(painting);
      // Run computer vision algorithms
      const results = await evaluateDrawing(canvas, srcStr);

      onFinishGame(canvas, results.breakdown, results.userEdgesBase64, results.refEdgesBase64);
    } else {
      // Fallback
      const dummyScore: ScoreBreakdown = {
        ssimScore: 0.0,
        colorScore: 0.0,
        edgeScore: 0.0,
        totalScore: 0.0,
        categoryLabel: "Blank Slate",
        description: "Your canvas is clean! Grab a brush and color in your chosen masterpiece!"
      };
      onFinishGame(null, dummyScore, "", "");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-1 bg-[#FDFCF8] h-[calc(100vh-16px)] flex flex-col justify-between overflow-hidden" id="gameplay-area">
      {/* Main split screens workspace - occupy 100% of height, strict no scrollbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 items-stretch overflow-hidden" id="main-splitscreen">
        
        {/* Left column (5 cols wide on lg): stacked reference image and artist palette */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 h-full overflow-hidden" id="left-column-ref">
          
          {/* Card 1: Merged Painting Reference + Title & Artist + clock */}
          <div className="p-3 bg-[#F4F3EF] border-4 border-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] rounded-none text-[#1C1C1C] flex flex-col h-[51%] min-h-0 overflow-hidden" id="reference-card">
            {/* Direct header */}
            <div className="flex items-center justify-between border-b border-[#1C1C1C]/10 pb-1.5 shrink-0" id="reference-title-hud">
              <div className="truncate pr-2">
                <h2 className="text-sm font-black text-[#1C1C1C] uppercase tracking-tight truncate leading-tight">{painting.name}</h2>
                <p className="text-[10px] text-[#1C1C1C]/80 font-bold truncate leading-none mt-0.5">
                  {painting.artist}, {painting.year} ({painting.style})
                </p>
              </div>
              {/* Pulsating Countdown Clock Tag */}
              <div
                className={`px-2 py-0.5 border-2 border-black font-mono font-black text-xs flex items-center gap-1 shrink-0 ${
                  secondsLeft <= 15
                    ? "bg-[#FF4500] text-white animate-pulse"
                    : "bg-white text-[#1C1C1C]"
                }`}
                id="hud-clock-tag"
              >
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{formatTime(secondsLeft)}</span>
              </div>
            </div>
            
            {/* Resized Large Reference Image Box */}
            <div className="flex-1 min-h-0 mt-2 relative border-2 border-[#1C1C1C] bg-[#1C1C1C] overflow-hidden flex items-center justify-center shadow-inner rounded-none" id="museum-ref-frame">
              <img
                src={getPaintingSrc(painting)}
                alt={painting.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Curator note line */}
            <p className="text-[10.5px] font-bold text-black/85 italic mt-1.5 leading-snug truncate shrink-0">
              Curator: {painting.authorNote || "Capture large color contours first before adding details."}
            </p>
          </div>

          {/* Card 2: Artist Palette Controls & Custom Mixer - Elegantly styled, NO scrollbar */}
          <div className="h-[46%] min-h-0 bg-[#EFECE6] border-4 border-[#1C1C1C] p-3 shadow-[4px_4px_0px_0px_#1C1C1C] rounded-none flex flex-col justify-between overflow-hidden" id="palette-controllers-card">
            
            {/* Header / mixed color preview */}
            <div className="flex items-center justify-between border-b border-black/10 pb-1 shrink-0">
              <div className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-[#FF4500]" />
                <span className="text-[11px] uppercase font-black font-sans text-[#1C1C1C]">Palette Mixer</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-black/70 text-[9px] font-mono font-bold uppercase">Mixed Block</span>
                <div
                  className="w-6 h-3.5 border-2 border-black"
                  style={{ backgroundColor: toolState.color }}
                />
              </div>
            </div>

            {/* Compact Brush size & opacity horizontal row */}
            <div className="grid grid-cols-2 gap-3 mt-1 shrink-0">
              {/* Brush size */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[9px] font-mono font-black text-[#1C1C1C] uppercase leading-none">
                  <span>Size</span>
                  <span>{toolState.brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={toolState.brushSize}
                  onChange={(e) => setToolState({ ...toolState, brushSize: parseInt(e.target.value) })}
                  className="w-full h-1 bg-white border border-[#1C1C1C] appearance-none cursor-pointer"
                  style={{ accentColor: "#1C1C1C" }}
                />
              </div>

              {/* Opacity */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[9px] font-mono font-black text-[#1C1C1C] uppercase leading-none">
                  <span>Opacity</span>
                  <span>{Math.round(toolState.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={toolState.opacity * 100}
                  onChange={(e) => setToolState({ ...toolState, opacity: parseInt(e.target.value) / 100 })}
                  className="w-full h-1 bg-white border border-[#1C1C1C] appearance-none cursor-pointer"
                  style={{ accentColor: "#1C1C1C" }}
                />
              </div>
            </div>

            {/* Presets color tray - strict spacing */}
            <div className="mt-1 flex flex-col gap-0.5 shrink-0">
              <span className="text-[9px] uppercase font-black font-mono text-[#1C1C1C]/75 leading-none">Shades Picker</span>
              <div className="grid grid-cols-8 gap-1" id="presets-container">
                {presetColors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPresetColor(color.hex)}
                    className={`aspect-square w-full rounded-none border border-[#1C1C1C] transition-transform hover:scale-105 cursor-pointer relative ${
                      toolState.color === color.hex && toolState.tool === "brush"
                        ? "ring-1 ring-black scale-105 border-white"
                        : ""
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    id={`preset-${idx}`}
                  />
                ))}
              </div>
            </div>

            {/* Custom Mixer Sliders: Hue, Saturation, Brightness */}
            <div className="mt-1 border-t border-black/10 pt-1 flex flex-col gap-1 shrink-0">
              {/* Hue */}
              <div className="flex items-center gap-1.5">
                <span className="w-16 text-[9.5px] font-black uppercase text-[#1C1C1C] leading-none">Hue</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsb.h}
                  onChange={(e) => {
  const newHsb = {
    ...hsb,
    h: parseInt(e.target.value)
  };

  setHsb(newHsb);

  const l =
    (newHsb.b / 100) *
    (1 - newHsb.s / 200) *
    100;

  setToolState(prev => ({
    ...prev,
    color: `hsl(${newHsb.h}, ${newHsb.s}%, ${l}%)`
  }));
}}
                  className="flex-grow h-2 border border-black rounded-none appearance-none cursor-pointer"
                  style={{
                    background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                    accentColor: "#1C1C1C"
                  }}
                />
                <span className="w-8 text-right text-[9.5px] font-mono font-black text-[#1C1C1C] shrink-0">{hsb.h}°</span>
              </div>

              {/* Saturation */}
              <div className="flex items-center gap-1.5">
                <span className="w-16 text-[9.5px] font-black uppercase text-[#1C1C1C] leading-none">Saturation</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsb.s}
onChange={(e) => {
  const newHsb = {
    ...hsb,
    s: parseInt(e.target.value)
  };

  setHsb(newHsb);

  const l =
    (newHsb.b / 100) *
    (1 - newHsb.s / 200) *
    100;

  setToolState(prev => ({
    ...prev,
    color: `hsl(${newHsb.h}, ${newHsb.s}%, ${l}%)`
  }));
}}                  className="flex-grow h-2 border border-black rounded-none appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${getHslString(hsb.h, 0, hsb.b)}, ${getHslString(hsb.h, 100, hsb.b)})`,
                    accentColor: "#1C1C1C"
                  }}
                />
                <span className="w-8 text-right text-[9.5px] font-mono font-black text-[#1C1C1C] shrink-0">{hsb.s}%</span>
              </div>

              {/* Brightness */}
              <div className="flex items-center gap-1.5">
                <span className="w-16 text-[9.5px] font-black uppercase text-[#1C1C1C] leading-none">Brightness</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsb.b}
onChange={(e) => {
  const newHsb = {
    ...hsb,
    b: parseInt(e.target.value)
  };

  setHsb(newHsb);

  const l =
    (newHsb.b / 100) *
    (1 - newHsb.s / 200) *
    100;

  setToolState(prev => ({
    ...prev,
    color: `hsl(${newHsb.h}, ${newHsb.s}%, ${l}%)`
  }));
}}                  className="flex-grow h-2 border border-black rounded-none appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #000000 0%, ${getHslString(hsb.h, hsb.s, 100)} 100%)`,
                    accentColor: "#1C1C1C"
                  }}
                />
                <span className="w-8 text-right text-[9.5px] font-mono font-black text-[#1C1C1C] shrink-0">{hsb.b}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (7 cols wide on lg): Greatly expanded canvas workspace */}
        <div className="lg:col-span-7 flex flex-col min-h-0 h-full overflow-hidden" id="right-column-canvas">
          <DrawingCanvas
            ref={canvasRef}
            toolState={toolState}
            setToolState={setToolState}
            onSubmit={handleFinalizeEvaluation}
          />
        </div>
      </div>
    </div>
  );
}
