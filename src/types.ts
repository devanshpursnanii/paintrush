/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Painting {
  id: string;
  name: string;
  artist: string;
  year: string;
  style: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  imageUrl?: string; // Used for preloaded generated photos
  svgMarkup?: string; // Custom vector representation for lightweight CORS-free loading
  authorNote?: string;
  category: "landscape" | "portrait" | "abstract" | "still_life";
}

export type ActiveTool = "brush" | "eraser" | "fill";

export interface ToolState {
  color: string;
  brushSize: number;
  opacity: number; // 0 to 1
  tool: ActiveTool;
}

export interface ScoreBreakdown {
  ssimScore: number;       // 0 to 10
  colorScore: number;      // 0 to 10
  edgeScore: number;       // 0 to 10
  totalScore: number;      // 0 to 10, weighted: 50% SSIM + 30% Color + 20% Edge
  categoryLabel: string;   // e.g. "Grand Master", "Artisanal Prodigy", etc.
  description: string;     // Friendly personalized feedback
}

export type GameStage = "landing" | "playing" | "evaluating" | "results";
