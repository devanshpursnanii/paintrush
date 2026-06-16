/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Cpu, Palette, Sparkles, Binary, Award } from "lucide-react";

interface EvaluationScreenProps {
  onEvaluationComplete: () => void;
}

export default function EvaluationScreen({ onEvaluationComplete }: EvaluationScreenProps) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: "Analyzing Brush Stroke Vector Data", desc: "Aligning canvas resolutions to unified 128x128 matrices", icon: Cpu },
    { title: "Extracting 3-Channel Color Histograms", desc: "Intersecting red, green, and blue bins", icon: Palette },
    { title: "Mapping Canny Edge Overlays", desc: "Isolating contour boundaries with custom Sobel matrices", icon: Binary },
    { title: "Calculating Structural Similarity (SSIM)", desc: "Evaluating luminance, contrast, and structural blocks", icon: Sparkles },
    { title: "Rendering Master's Certificate Card", desc: "Packing canvas pixels for sharing", icon: Award }
  ];

  useEffect(() => {
    // Increment progress and active steps over exactly 2.0 seconds (2000ms)
    const totalDuration = 2000;
    const intervalTime = 40; // 50 updates over 2000ms
    const stepIncrement = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + stepIncrement;
        if (nextProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onEvaluationComplete();
          }, 300); // Tiny pause for full-percentage satisfaction
          return 100;
        }

        // Advance steps based on percentage
        const currentStep = Math.min(
          steps.length - 1,
          Math.floor((nextProgress / 100) * steps.length)
        );
        setActiveStep(currentStep);

        return nextProgress;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full max-h-full px-4 py-4 relative bg-[#FDFCF8] select-none" id="evaluation-screen-container">
      <div className="max-w-md w-full bg-white border-4 border-[#1C1C1C] p-6 text-center shadow-[6px_6px_0px_0px_#1C1C1C] rounded-none relative z-10" id="loader-panel">
        {/* Central glowing reactor spinner */}
        <div className="flex justify-center mb-5 relative" id="spinner-cluster">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Outer dotted running ring */}
            <div className="absolute inset-0 border-3 border-dashed border-black rounded-full animate-spin [animation-duration:8s]" />
            {/* Inter glow ring */}
            <div className="absolute inset-1.5 border-2 border-[#FFD750] rounded-full animate-spin [animation-duration:3s] [animation-direction:reverse]" />
            {/* Core rotating vector symbol */}
            <div className="w-10 h-10 bg-[#FF4500] border-2 border-[#1C1C1C] rounded-none flex items-center justify-center text-white shadow-[1px_1px_0px_0px_#1C1C1C]">
              <Cpu className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Dynamic Percentage Badge */}
        <div className="mb-3" id="percentage-indicator">
          <span className="text-3xl font-sans font-black tracking-tight text-[#1C1C1C]">
            {Math.min(100, Math.floor(progress))}%
          </span>
          <span className="text-[#1C1C1C] text-[10px] font-mono block mt-0.5 uppercase tracking-widest font-black">Evaluating Masterpiece</span>
        </div>

        {/* Global Loading Bar */}
        <div className="w-full h-4 bg-white border-2 border-black rounded-none overflow-hidden mb-5" id="progress-bar-slot">
          <motion.div
            className="h-full bg-[#1C1C1C]"
            style={{ width: `${progress}%` }}
            layoutId="scanning-bar-inner"
          />
        </div>

        {/* Active Step Block */}
        <div className="min-h-[65px] transition-all" id="steps-card">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;

            if (!isActive && !isCompleted) return null;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 text-left p-2.5 rounded-none bg-[#FDFCF8] border-2 border-[#1C1C1C] shadow-[2px_2px_0px_0px_#1C1C1C]"
              >
                <div
                  className={`p-1.5 rounded-none border border-[#1C1C1C] shrink-0 ${
                    isActive
                      ? "bg-[#FFD700] text-[#1C1C1C]"
                      : "bg-[#F3F4F6] text-[#1C1C1C]/50"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-[#1C1C1C] truncate">
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-[#1C1C1C]/75 leading-tight font-sans font-semibold truncate">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Subtitle */}
        <p className="text-[9px] text-black/60 uppercase tracking-widest font-mono mt-4 font-black leading-none" id="security-assurance">
          In-Browser scan engine • zero lag
        </p>
      </div>
    </div>
  );
}
