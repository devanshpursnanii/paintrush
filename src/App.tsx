/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Volume2, VolumeX, ShieldAlert, BookOpen, Clock, Award } from "lucide-react";
import { GameStage, Painting, ScoreBreakdown } from "./types";
import { paintings } from "./data/paintings.ts";
import { loadOpenCV } from "./lib/cvEvaluation";

// Import Components
import LandingPage from "./components/LandingPage";
import GameScreen from "./components/GameScreen";
import EvaluationScreen from "./components/EvaluationScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const [stage, setStage] = useState<GameStage>("landing");
  const [currentPainting, setCurrentPainting] = useState<Painting>(paintings[0]);

  // Saved evaluation canvas & score bundles
  const [userCanvas, setUserCanvas] = useState<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [userEdges, setUserEdges] = useState<string>("");
  const [refEdges, setRefEdges] = useState<string>("");

  // Sound toggling
  const [muteSound, setMuteSound] = useState(true);

  // Load OpenCV.js asynchronously on mount in the background
  useEffect(() => {
    loadOpenCV();
  }, []);

  // Lobby handler: starts game, picks a random painting
  const handleStartGame = () => {
    // Pick randomly from the masterpiece paintings loaded in local paintings
    const randomIndex = Math.floor(Math.random() * paintings.length);
    const assigned = paintings[randomIndex];
    setCurrentPainting(assigned);

    // Clear previous results
    setUserCanvas(null);
    setScore(null);
    setUserEdges("");
    setRefEdges("");

    // Push stage
    setStage("playing");
  };

  // Callback when timer expires/user submits: transitions to evaluation stage loader
  const handleTimerExpired = () => {
    setStage("evaluating");
  };

  // Callback from evaluation module completing calculations
  const handleFinishedEvaluation = (
    canvas: HTMLCanvasElement | null,
    finalScore: ScoreBreakdown,
    userEdgesB64: string,
    refEdgesB64: string
  ) => {
    setUserCanvas(canvas);
    setScore(finalScore);
    setUserEdges(userEdgesB64);
    setRefEdges(refEdgesB64);
  };

  // Evaluation loader callback: goes to results stage once calculations finish
  const handleLoaderConcluded = () => {
    setStage("results");
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1C1C1C] font-sans selection:bg-[#FFD700]/50 selection:text-black overflow-hidden flex flex-col justify-between border-4 border-[#1C1C1C]" id="app-wrapper">
      {/* Global Branding Header - Hidden during gameplay & evaluation to maximize canvas space */}
      {stage !== "playing" && stage !== "evaluating" && (
        <header className="h-14 border-b-4 border-[#1C1C1C] flex items-center justify-between px-4 md:px-10 bg-[#FFD700] sticky top-0 z-40" id="main-header">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => setStage("landing")} id="brand-logo-btn">
              <div className="p-1.5 bg-white text-black border-2 border-[#1C1C1C] shadow-[1.5px_1.5px_0px_0px_#1C1C1C]">
                <Palette className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl uppercase tracking-tighter italic text-[#1C1C1C] leading-none">
                  PaintRush
                </span>
                <span className="text-[8px] font-black tracking-widest text-[#1C1C1C] opacity-75 block uppercase font-mono leading-none mt-0.5">
                  Art Sprint AI
                </span>
              </div>
            </div>

            {/* Quick HUD controls */}
            <div className="flex items-center gap-4" id="utility-hud-controls">
              {stage === "results" && (
                <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-black text-black border-2 border-[#1C1C1C] px-2.5 py-0.5 bg-white shadow-[1.5px_1.5px_0px_0px_#1C1C1C]">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Certified Canvas</span>
                </div>
              )}

              {/* Mute toggle button */}
              <button
                onClick={() => setMuteSound(!muteSound)}
                className="p-1.5 bg-white border-2 border-[#1C1C1C] text-black hover:bg-[#F0E6D2] shadow-[1.5px_1.5px_0px_0px_#1C1C1C] transition-all cursor-pointer"
                title={muteSound ? "Unmute ambiance" : "Mute audio"}
              >
                {muteSound ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Container Stage Switch */}
      <main className="flex-grow w-full relative z-10 bg-[#FDFCF8] min-h-0 overflow-hidden" id="main-content-flow-container">
        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LandingPage onStartGame={handleStartGame} />
            </motion.div>
          )}

          {stage === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GameScreen
                painting={currentPainting}
                onFinishGame={handleFinishedEvaluation}
                onTimerExpired={handleTimerExpired}
              />
            </motion.div>
          )}

          {stage === "evaluating" && (
            <motion.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EvaluationScreen onEvaluationComplete={handleLoaderConcluded} />
            </motion.div>
          )}

          {stage === "results" && score && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ResultsScreen
                painting={currentPainting}
                userCanvasElement={userCanvas}
                scoreBreakdown={score}
                userEdgesBase64={userEdges}
                refEdgesBase64={refEdges}
                onPlayAgain={handleStartGame}
                onGoHome={() => setStage("landing")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer
  className="h-10 bg-[#1C1C1C] text-white flex items-center justify-center px-6 md:px-10 text-[10px] font-bold tracking-[0.2em] font-mono border-t-2 border-[#1C1C1C]"
  id="app-footer"
>
  MADE WITH ❤️ BY DEVANSH 
</footer>
    </div>
  );
}
