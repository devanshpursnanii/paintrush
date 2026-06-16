/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Undo2,
  Redo2,
  RotateCcw,
  Paintbrush,
  Droplets,
  CircleDot,
  CheckCircle2
} from "lucide-react";
import { ToolState, ActiveTool } from "../types";

export interface DrawingCanvasHandle {
  getCanvasElement: () => HTMLCanvasElement | null;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

interface DrawingCanvasProps {
  toolState: ToolState;
  setToolState: (state: ToolState) => void;
  onSubmit?: () => void;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ toolState, setToolState, onSubmit }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // History stack for Undo/Redo operations
    const [history, setHistory] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);



    // Internal canvas resolution
    const internalWidth = 400;
    const internalHeight = 400;

    // UseImperativeHandle to expose canvas commands to general Game screen
    useImperativeHandle(ref, () => ({
      getCanvasElement: () => canvasRef.current,
      clearCanvas: () => {
        handleClear();
      },
      undo: () => {
        handleUndo();
      },
      redo: () => {
        handleRedo();
      }
    }));

    // Initialize Canvas on mounting (paint it cleanly white to match paper reference canvas)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          // Fill canvas white initially so drawing feels like canvas
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, internalWidth, internalHeight);

          // Save the very first blank state into history so undo can go back to complete blank
          const initialState = ctx.getImageData(0, 0, internalWidth, internalHeight);
          setHistory([initialState]);
        }
      }
    }, []);


    // continue painting if the mouse leaves
    useEffect(() => {
      const stopDrawing = () => {
        setIsDrawing(false);
      };

      window.addEventListener("mouseup", stopDrawing);
      window.addEventListener("touchend", stopDrawing);

      return () => {
        window.removeEventListener("mouseup", stopDrawing);
        window.removeEventListener("touchend", stopDrawing);
      };
    }, []);



    // Save previous state for undo pipelines
    const saveStateToHistory = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentImgData = ctx.getImageData(0, 0, internalWidth, internalHeight);
      setHistory((prev) => {
        const newStack = [...prev, currentImgData];
        // Enforce 25 stack ceiling to conserve local system memory
        if (newStack.length > 10) {
          newStack.shift();
        }
        return newStack;
      });
      // Drawing clears the redo path
      setRedoStack([]);
    };

    const handleUndo = () => {
      const canvas = canvasRef.current;
      if (!canvas || history.length <= 1) return; // Need at least the initial blank state to remain

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Current state to be popped
      const current = history[history.length - 1];
      const previous = history[history.length - 2];

      // Update stacks
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setRedoStack((prev) => [...prev, current]);

      // Apply previous state
      ctx.putImageData(previous, 0, 0);
    };

    const handleRedo = () => {
      if (redoStack.length === 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const nextState = redoStack[redoStack.length - 1];

      setRedoStack((prev) => prev.slice(0, prev.length - 1));
      setHistory((prev) => [...prev, nextState]);

      ctx.putImageData(nextState, 0, 0);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill canvas clean white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, internalWidth, internalHeight);

      saveStateToHistory();
    };

    // Calculate mouse/touch relative coordinates to the 400x400 internal coordinate plane
    const getCoordinates = (e: any): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      // Detect touch vs mouse
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Convert from screen dimension back to internal coordinate space
      const scaleX = internalWidth / rect.width;
      const scaleY = internalHeight / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const floodFill = (
  startX: number,
  startY: number,
  fillColor: string
) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(
    0,
    0,
    internalWidth,
    internalHeight
  );

  const data = imageData.data;

  const colorToRgb = (color: string) => {
  const temp = document.createElement("canvas");
  temp.width = 1;
  temp.height = 1;

  const tempCtx = temp.getContext("2d");
  if (!tempCtx) {
    return { r: 0, g: 0, b: 0, a: 255 };
  }

  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, 1, 1);

  const pixel = tempCtx.getImageData(0, 0, 1, 1).data;

  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2],
    a: pixel[3]
  };
};

const fill = colorToRgb(fillColor);

  const startIndex =
    (Math.floor(startY) * internalWidth + Math.floor(startX)) * 4;

  const target = {
    r: data[startIndex],
    g: data[startIndex + 1],
    b: data[startIndex + 2],
    a: data[startIndex + 3]
  };

  const alreadyFilled =
  Math.abs(target.r - fill.r) < 5 &&
  Math.abs(target.g - fill.g) < 5 &&
  Math.abs(target.b - fill.b) < 5;

    if (alreadyFilled) {
      return;
    }

  const stack = [[Math.floor(startX), Math.floor(startY)]];
  let processed = 0;
const MAX_PIXELS = 300000;

  while (stack.length) {
    processed++;

if (processed > MAX_PIXELS) {
  break;
}
    const [x, y] = stack.pop()!;

    if (
      x < 0 ||
      y < 0 ||
      x >= internalWidth ||
      y >= internalHeight
    ) {
      continue;
    }

    const idx = (y * internalWidth + x) * 4;

    const tolerance = 40;

    const matches =
      Math.abs(data[idx] - target.r) <= tolerance &&
      Math.abs(data[idx + 1] - target.g) <= tolerance &&
      Math.abs(data[idx + 2] - target.b) <= tolerance;

    if (!matches) {
      continue;
    }

    data[idx] = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);

  saveStateToHistory();
};

    // Begin drawing stroke
    const startDrawing = (e: any) => {
      if (toolState.tool === "fill") {
        const coords = getCoordinates(e);

        if (!coords) return;

        floodFill(
          coords.x,
          coords.y,
          toolState.color
        );

          return;
        }
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPos.current = coords;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          // Highlight single tap / point click
          ctx.arc(coords.x, coords.y, toolState.brushSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = toolState.tool === "eraser" ? "#ffffff" : toolState.color;
          ctx.globalAlpha = toolState.opacity;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    };

    // Draw active motion
    const draw = (e: any) => {
      if (!isDrawing) return;
      e.preventDefault();

      const coords = getCoordinates(e);
      if (!coords) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(coords.x, coords.y);

      // Stroke configurations
      ctx.lineWidth = toolState.brushSize;
      ctx.strokeStyle = toolState.tool === "eraser" ? "#ffffff" : toolState.color;
      ctx.globalAlpha = toolState.opacity;
      ctx.stroke();
      ctx.globalAlpha = 1;

      lastPos.current = coords;
    };

    // Conclude stroke
    const endDrawing = () => {
      if (isDrawing) {
        setIsDrawing(false);
        saveStateToHistory();
      }
    };



    return (
      <div className="flex flex-col gap-2.5 w-full h-full text-black font-sans" id="drawing-workspace">
        {/* Undo, Redo, Clear Controls row */}
        <div className="flex items-center justify-between bg-[#F0E6D2] border-4 border-[#1C1C1C] rounded-none px-3 py-1.5 shadow-[4px_4px_0px_0px_#1C1C1C]" id="workspace-action-bar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setToolState({ ...toolState, tool: "brush" });
              }}
              className={`px-3 py-1 flex items-center gap-1 font-black text-xs uppercase tracking-tight border-2 border-[#1C1C1C] transition-all cursor-pointer rounded-none relative ${
                toolState.tool === "brush"
                  ? "bg-[#FF4500] text-white shadow-[1px_1px_0px_0px_#1C1C1C]"
                  : "bg-white text-black hover:bg-[#EADEC9]"
              }`}
              title="Paint Brush"
              id="tool-brush"
            >
              <Paintbrush className="w-3 h-3 stroke-[2.5]" />
              <span>Brush</span>
            </button>
            <button
              onClick={() => {
                setToolState({ ...toolState, tool: "fill" });
              }}
              className={`px-3 py-1 flex items-center gap-1 font-black text-xs uppercase tracking-tight border-2 border-[#1C1C1C] transition-all cursor-pointer rounded-none relative ${
                toolState.tool === "fill"
                  ? "bg-[#FF4500] text-white shadow-[1px_1px_0px_0px_#1C1C1C]"
                  : "bg-white text-black hover:bg-[#EADEC9]"
              }`}
              title="Paint Bucket Fill"
              id="tool-fill"
            >
              <Droplets className="w-3 h-3 stroke-[2.5]" />
              <span>Fill</span>
            </button>
            <button
              onClick={() => {
                setToolState({ ...toolState, tool: "eraser" });
              }}
              className={`px-3 py-1 flex items-center gap-1 font-black text-xs uppercase tracking-tight border-2 border-[#1C1C1C] transition-all cursor-pointer rounded-none relative ${
                toolState.tool === "eraser"
                  ? "bg-[#FF4500] text-white shadow-[1px_1px_0px_0px_#1C1C1C]"
                  : "bg-white text-black hover:bg-[#EADEC9]"
              }`}
              title="Canvas Eraser"
              id="tool-eraser"
            >
              <CircleDot className="w-3 h-3 stroke-[2.5]" />
              <span>Eraser</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1 border-2 border-[#1C1C1C] bg-white hover:bg-[#EADEC9] text-[#1C1C1C] disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer rounded-none font-bold"
              title="Undo Last Stroke (Ctrl+Z)"
              id="action-undo"
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 border-2 border-[#1C1C1C] bg-white hover:bg-[#EADEC9] text-[#1C1C1C] disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer rounded-none font-bold"
              title="Redo Stroke"
              id="action-redo"
            >
              <Redo2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <div className="w-px h-5 bg-black opacity-20 mx-0.5" />
            <button
              onClick={handleClear}
              className="px-2.5 py-1 bg-white hover:bg-[#EADEC9] border-2 border-[#1C1C1C] hover:shadow-[1px_1px_0px_0px_#1C1C1C] transition-all flex items-center gap-1 text-xs font-black uppercase tracking-wider cursor-pointer rounded-none shadow-[1px_1px_0px_0px_#1C1C1C]"
              title="Clear entire canvas"
              id="action-clear"
            >
              <RotateCcw className="w-3 h-3 stroke-[2.5]" />
              <span>Clear</span>
            </button>
            {onSubmit && (
              <>
                <div className="w-px h-5 bg-black opacity-20 mx-0.5" />
                <button
                  onClick={onSubmit}
                  className="px-3 py-1 bg-[#008080] text-white hover:bg-[#006666] border-2 border-[#1C1C1C] hover:shadow-[2px_2px_0px_0px_#1C1C1C] shadow-[1px_1px_0px_0px_#1C1C1C] transition-all flex items-center gap-1 text-xs font-black uppercase tracking-wider cursor-pointer rounded-none"
                  title="Submit your masterpiece for AI evaluation"
                  id="action-submit-canvas"
                >
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  <span>Submit Work</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic HTML5 Canvas Frame */}
        <div className="relative flex-1 min-h-0 border-4 border-[#1C1C1C] bg-white rounded-none p-1 shadow-[8px_8px_0px_0px_#1C1C1C] flex items-center justify-center aspect-square select-none overflow-hidden" id="canvas-aspect-wrapper">
          <canvas
            ref={canvasRef}
            width={internalWidth}
            height={internalHeight}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="w-full h-full cursor-crosshair bg-white touch-none"
            id="paint-canvas3000"
          />
        </div>
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
