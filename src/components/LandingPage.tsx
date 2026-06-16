/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Palette, Clock, Cpu, Award, Play } from "lucide-react";
import { paintings } from "../data/paintings.ts";

interface LandingPageProps {
  onStartGame: () => void;
}

export default function LandingPage({ onStartGame }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-h-full text-[#1C1C1C] px-3 md:px-6 py-4 relative overflow-hidden bg-[#FDFCF8] select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full text-center relative z-10 flex flex-col items-center justify-center h-full"
        id="landing-container"
      >
        {/* Logo Icon */}
        <div className="flex justify-center mb-2.5" id="logo-icon-wrapper">
          <div className="relative p-3 bg-[#FFD700] text-[#1C1C1C] border-4 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C]">
            <Palette className="w-8 h-8 stroke-[2.5]" id="main-palette-icon" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 bg-[#FF4500] border border-black"></span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-[#1C1C1C] mb-1 leading-none"
          id="app-title-display"
        >
          PaintRush
        </h1>

        <p className="text-xs md:text-sm text-[#1C1C1C]/85 font-black max-w-xl mx-auto mb-4 leading-relaxed font-sans">
          The ultimate 3-minute digital canvas sprint. Recreate famous masterpieces and let our in-browser computer vision scanner evaluate your alignment!
        </p>

        {/* Rules Bento Layout - Extremely compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full max-w-2xl mb-4" id="rules-grid">
          {/* Rule 1 */}
          <div className="p-3 bg-white border-2 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C]" id="rule-1">
            <div className="flex items-center gap-2 mb-1 text-black">
              <div className="p-0.5 bg-[#FFD700] border border-[#1C1C1C]">
                <Palette className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <h3 className="font-extrabold uppercase tracking-tight text-[11px] text-[#1C1C1C]">1. Classic Masterpiece</h3>
            </div>
            <p className="text-[#1C1C1C]/80 text-[10px] leading-snug font-bold">
              We pick from <span className="underline decoration-[#FF4500] decoration-1 font-black">curated classical artworks</span> dynamically at start.
            </p>
          </div>

          {/* Rule 2 */}
          <div className="p-3 bg-white border-2 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C]" id="rule-2">
            <div className="flex items-center gap-2 mb-1 text-black">
              <div className="p-0.5 bg-[#FFD700] border border-[#1C1C1C]">
                <Clock className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <h3 className="font-extrabold uppercase tracking-tight text-[11px] text-[#1C1C1C]">2. Three-Minute Speed run</h3>
            </div>
            <p className="text-[#1C1C1C]/80 text-[10px] leading-snug font-bold">
              You get exactly <span className="bg-[#1C1C1C] text-[#FFD700] px-1 py-0.5 font-mono font-black text-[9px]">3:00 mins</span>. Precision and speed are absolute keys!
            </p>
          </div>

          {/* Rule 3 */}
          <div className="p-3 bg-white border-2 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C]" id="rule-3">
            <div className="flex items-center gap-2 mb-1 text-black">
              <div className="p-0.5 bg-[#FFD700] border border-[#1C1C1C]">
                <Cpu className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <h3 className="font-extrabold uppercase tracking-tight text-[11px] text-[#1C1C1C]">3. AI Computer Vision</h3>
            </div>
            <p className="text-[#1C1C1C]/80 text-[10px] leading-snug font-bold">
              Local scanner calculates <span className="underline decoration-[#FF4500] decoration-1 font-black">SSIM similarity</span>, and Canny match coefficients.
            </p>
          </div>

          {/* Rule 4 */}
          <div className="p-3 bg-white border-2 border-[#1C1C1C] shadow-[3px_3px_0px_0px_#1C1C1C]" id="rule-4">
            <div className="flex items-center gap-2 mb-1 text-black">
              <div className="p-0.5 bg-[#FFD700] border border-[#1C1C1C]">
                <Award className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <h3 className="font-extrabold uppercase tracking-tight text-[11px] text-[#1C1C1C]">4. Portrait Certificates</h3>
            </div>
            <p className="text-[#1C1C1C]/80 text-[10px] leading-snug font-bold">
              Complete your recreation and earn a beautiful downloadable certificate showing your score!
            </p>
          </div>
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartGame}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF4500] text-white border-3 border-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] font-black uppercase text-sm tracking-tight transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#1C1C1C] cursor-pointer group rounded-none"
          id="btn-play-game"
        >
          <Play className="w-4 h-4 fill-white transition-transform group-hover:translate-x-0.5" />
          <span>Enter the Gallery</span>
        </motion.button>

        {/* Gallery Size Counter Footer */}
        <div className="mt-4 text-[#1C1C1C]/60 text-[9px] tracking-widest font-mono uppercase font-black" id="masterpieces-counter">
          Curated Gallery: {paintings.length} Famous Masterpieces Active
        </div>
      </motion.div>
    </div>
  );
}
