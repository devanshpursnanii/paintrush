/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScoreBreakdown } from "../types";

// Inject OpenCV.js from a CDN dynamically
let opencvLoadingPromise: Promise<boolean> | null = null;
const OPENCV_CDN_URL = "https://cdn.jsdelivr.net/npm/@techstardev/opencv-js@4.7.0/dist/opencv.js";

export function loadOpenCV(): Promise<boolean> {
  if (opencvLoadingPromise) return opencvLoadingPromise;

  opencvLoadingPromise = new Promise((resolve) => {
    if ((window as any).cv) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = OPENCV_CDN_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Check periodically for cv object initialization
      const checkInterval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          clearInterval(checkInterval);
          console.log("OpenCV.js initialized successfully!");
          resolve(true);
        }
      }, 100);

      // Timeout after 12 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 12000);
    };

    script.onerror = () => {
      console.warn("OpenCV.js failed to load from CDN. Falling back to pure-TS CV Engine.");
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return opencvLoadingPromise;
}

/**
 * Compares user drawing on canvas vs a reference image.
 * Resizes both to 128x128, extracts pixel buffers, and computes metrics.
 */
export async function evaluateDrawing(
  userCanvas: HTMLCanvasElement,
  referenceImgSrc: string
): Promise<{
  breakdown: ScoreBreakdown;
  userEdgesBase64: string;
  refEdgesBase64: string;
}> {
  // 1. Create offscreen canvas for user drawing
  const commonSize = 128;
  const userOffscreen = document.createElement("canvas");
  userOffscreen.width = commonSize;
  userOffscreen.height = commonSize;
  const userCtx = userOffscreen.getContext("2d")!;
  userCtx.drawImage(userCanvas, 0, 0, commonSize, commonSize);
  const userData = userCtx.getImageData(0, 0, commonSize, commonSize);

  // 2. Load and draw reference image on offscreen canvas
  const refOffscreen = document.createElement("canvas");
  refOffscreen.width = commonSize;
  refOffscreen.height = commonSize;
  const refCtx = refOffscreen.getContext("2d")!;

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      refCtx.drawImage(img, 0, 0, commonSize, commonSize);
      resolve();
    };
    img.onerror = () => {
      // Fallback: draw background with canvas text if image loading fails
      refCtx.fillStyle = "#2c3e50";
      refCtx.fillRect(0, 0, commonSize, commonSize);
      refCtx.fillStyle = "#ffffff";
      refCtx.font = "14px Inter";
      refCtx.fillText("Reference", 30, 60);
      resolve();
    };
    img.src = referenceImgSrc;
  });

  const refData = refCtx.getImageData(0, 0, commonSize, commonSize);

  // 3. Extract pixels and perform calculations in pure TS (extremely stable & instant fallback / main thread)
  const uPixels = userData.data;
  const rPixels = refData.data;

  // Convert to grayscale for SSIM and Edges
  const uGray = new Float32Array(commonSize * commonSize);
  const rGray = new Float32Array(commonSize * commonSize);

  for (let i = 0; i < commonSize * commonSize; i++) {
    const idx = i * 4;
    // Standard Luma formula
    uGray[i] = 0.299 * uPixels[idx] + 0.587 * uPixels[idx + 1] + 0.114 * uPixels[idx + 2];
    rGray[i] = 0.299 * rPixels[idx] + 0.587 * rPixels[idx + 1] + 0.114 * rPixels[idx + 2];
  }

  // --- METRIC 1: SSIM (Structural Similarity Index) ---
  // Window size: 16x16 blocks. 128x128 consists of 8x8 = 64 blocks of size 16x16
  const blockSize = 16;
  const blocksCount = commonSize / blockSize; // 8
  let sumSSIM = 0;

  // SSIM Constants
  const C1 = 6.5; // (0.01 * 255)^2
  const C2 = 58.5; // (0.03 * 255)^2

  for (let by = 0; by < blocksCount; by++) {
    for (let bx = 0; bx < blocksCount; bx++) {
      // Calculate mean
      let muX = 0;
      let muY = 0;
      const pixelsInBlock = blockSize * blockSize;

      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const px = (by * blockSize + y) * commonSize + (bx * blockSize + x);
          muX += uGray[px];
          muY += rGray[px];
        }
      }
      muX /= pixelsInBlock;
      muY /= pixelsInBlock;

      // Calculate variance & covariance
      let varX = 0;
      let varY = 0;
      let covXY = 0;

      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const px = (by * blockSize + y) * commonSize + (bx * blockSize + x);
          const diffX = uGray[px] - muX;
          const diffY = rGray[px] - muY;
          varX += diffX * diffX;
          varY += diffY * diffY;
          covXY += diffX * diffY;
        }
      }
      varX /= pixelsInBlock - 1 || 1;
      varY /= pixelsInBlock - 1 || 1;
      covXY /= pixelsInBlock - 1 || 1;

      // Compute block SSIM
      const numerator = (2 * muX * muY + C1) * (2 * covXY + C2);
      const denominator = (muX * muX + muY * muY + C1) * (varX + varY + C2);
      sumSSIM += numerator / denominator;
    }
  }

  // SSIM score is scaled to 0-1 range, average of all 64 blocks
  const rawSSIM = sumSSIM / (blocksCount * blocksCount);
  // Normalize and scale to 0-10, clamping values
  const ssimScore = Math.max(0, Math.min(10, (rawSSIM + 0.1) * 9)); // Friendly scaling to reward artistic efforts

  // --- METRIC 2: Color Histogram Similarity (R,G,B intersection) ---
  // 8 bins of size 32 each
  const bins = 8;
  const uHistR = new Float32Array(bins);
  const uHistG = new Float32Array(bins);
  const uHistB = new Float32Array(bins);
  const rHistR = new Float32Array(bins);
  const rHistG = new Float32Array(bins);
  const rHistB = new Float32Array(bins);

  for (let i = 0; i < commonSize * commonSize; i++) {
    const idx = i * 4;
    // Bin indices (0 to 7)
    const uBinR = Math.min(bins - 1, Math.floor(uPixels[idx] / 32));
    const uBinG = Math.min(bins - 1, Math.floor(uPixels[idx + 1] / 32));
    const uBinB = Math.min(bins - 1, Math.floor(uPixels[idx + 2] / 32));

    const rBinR = Math.min(bins - 1, Math.floor(rPixels[idx] / 32));
    const rBinG = Math.min(bins - 1, Math.floor(rPixels[idx + 1] / 32));
    const rBinB = Math.min(bins - 1, Math.floor(rPixels[idx + 2] / 32));

    uHistR[uBinR]++;
    uHistG[uBinG]++;
    uHistB[uBinB]++;

    rHistR[rBinR]++;
    rHistG[rBinG]++;
    rHistB[rBinB]++;
  }

  // Normalize histograms (sum to 1)
  const totalPix = commonSize * commonSize;
  for (let b = 0; b < bins; b++) {
    uHistR[b] /= totalPix;
    uHistG[b] /= totalPix;
    uHistB[b] /= totalPix;
    rHistR[b] /= totalPix;
    rHistG[b] /= totalPix;
    rHistB[b] /= totalPix;
  }

  // Calculate histogram intersection of R,G,B
  let interR = 0;
  let interG = 0;
  let interB = 0;
  for (let b = 0; b < bins; b++) {
    interR += Math.min(uHistR[b], rHistR[b]);
    interG += Math.min(uHistG[b], rHistG[b]);
    interB += Math.min(uHistB[b], rHistB[b]);
  }
  const colorSimilarity = (interR + interG + interB) / 3;
  // Scaled color similarity to 0-10, adding helper offset so white canvases aren't punished too heavily
  const colorScore = Math.max(1, Math.min(10, colorSimilarity * 10));

  // --- METRIC 3: Edge Similarity via Sobel Edge and Precision/Recall Matching ---
  const uEdges = new Uint8Array(commonSize * commonSize);
  const rEdges = new Uint8Array(commonSize * commonSize);
  const border = 1;

  // Sobel convolution
  for (let y = border; y < commonSize - border; y++) {
    for (let x = border; x < commonSize - border; x++) {
      const idx = y * commonSize + x;

      // Sobel Kernels
      // Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
      // Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
      let uGx = 0;
      let uGy = 0;
      let rGx = 0;
      let rGy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pIdx = (y + ky) * commonSize + (x + kx);
          const uGVal = uGray[pIdx];
          const rGVal = rGray[pIdx];

          // kernel factors
          const fx = kx * (ky === 0 ? 2 : 1);
          const fy = ky * (kx === 0 ? 2 : 1);

          uGx += uGVal * fx;
          uGy += uGVal * fy;
          rGx += rGVal * fx;
          rGy += rGVal * fy;
        }
      }

      const uMag = Math.sqrt(uGx * uGx + uGy * uGy);
      const rMag = Math.sqrt(rGx * rGx + rGy * rGy);

      // Binary edge arrays (threshold of 60)
      uEdges[idx] = uMag > 60 ? 255 : 0;
      rEdges[idx] = rMag > 60 ? 255 : 0;
    }
  }

  // Calculate Precision and Recall on edges to be robust against blank canvas or random noise
  let refEdgeHits = 0;
  let totalRefEdges = 0;
  let userEdgeHits = 0;
  let totalUserEdges = 0;

  for (let y = border; y < commonSize - border; y++) {
    for (let x = border; x < commonSize - border; x++) {
      const idx = y * commonSize + x;
      if (rEdges[idx] > 0) {
        totalRefEdges++;
        // Check if user has an edge in a 3x3 neighborhood
        let found = false;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny >= 0 && ny < commonSize && nx >= 0 && nx < commonSize) {
              if (uEdges[ny * commonSize + nx] > 0) {
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
        if (found) refEdgeHits++;
      }

      if (uEdges[idx] > 0) {
        totalUserEdges++;
        // Check if reference has an edge in a 5x5 neighborhood (slightly more forgiving for users)
        let found = false;
        for (let ky = -2; ky <= 2; ky++) {
          for (let kx = -2; kx <= 2; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny >= 0 && ny < commonSize && nx >= 0 && nx < commonSize) {
              if (rEdges[ny * commonSize + nx] > 0) {
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
        if (found) userEdgeHits++;
      }
    }
  }

  const recallEdge = totalRefEdges > 0 ? (refEdgeHits / totalRefEdges) : 1.0;
  const precisionEdge = totalUserEdges > 0 ? (userEdgeHits / totalUserEdges) : 0.0;

  // Final Edge score is a combination of trace compliance (recall) and clutter penalty (precision)
  const edgeSimilarityScore = totalUserEdges > 0 
    ? (precisionEdge * 0.4 + recallEdge * 0.6) * 10
    : 0.0;
  const edgeScore = Math.max(0, Math.min(10, edgeSimilarityScore));

  // --- BLANK CANVAS EXPLICIT CHECK & PUNISHMENT ---
  // Detect what ratio of pixels has changed from pure white (#ffffff)
  let changedPixels = 0;
  for (let i = 0; i < uPixels.length; i += 4) {
    const r = uPixels[i];
    const g = uPixels[i + 1];
    const b = uPixels[i + 2];
    // If any pixel color is non-white (with a tolerance of 2)
    if (r < 253 || g < 253 || b < 253) {
      changedPixels++;
    }
  }
  const drawnRatio = changedPixels / (commonSize * commonSize);

  // --- FINAL COMBINED SCORE CALCULATION ---
  // Formula: 50% SSIM + 30% Color Similarity + 20% Edge Similarity
  let rawTotalScore = (ssimScore * 0.5) + (colorScore * 0.3) + (edgeScore * 0.2);
  let totalScore = Math.min(10.0, Math.max(0.0, Math.round(rawTotalScore * 10) / 10));

  // Overwrite if canvas looks blank or has fewer than 100 drawn pixels (~0.6% of canvas)
  const isBlank = drawnRatio < 0.006 || totalUserEdges < 4;

  if (isBlank) {
    totalScore = 0.0;
  }

  // Determine Category label & motivational reviews based on score
  let categoryLabel = "Artistic Prodigy";
  let description = "You have an incredible spatial memory and master of brush control! This matches the classical artwork beautifully.";

  if (isBlank) {
    categoryLabel = "Blank Slate";
    description = "You did not paint on the canvas or only made brief specs. Grab a brush, pick some gorgeous shades, and let your creativity take over!";
  } else if (totalScore >= 8.5) {
    categoryLabel = "Grand Master";
    description = "Flawless composition, precise geometry, and amazing color accuracy! Da Vinci himself would applaud your majestic masterpiece.";
  } else if (totalScore >= 7.0) {
    categoryLabel = "Master Illustrator";
    description = "Magnificent brush control! Your color selection and spatial shapes are incredibly accurate and artistic.";
  } else if (totalScore >= 5.0) {
    categoryLabel = "Creative Artisan";
    description = "A wonderful depiction! You captured the soul, color palette, and general forms of the painting very well.";
  } else if (totalScore >= 3.0) {
    categoryLabel = "Novice Painter";
    description = "A brave attempt! Recreating masterworks in 3 minutes is tough. Focus on placing larger blobs of color first!";
  } else {
    categoryLabel = "Abstract Apprentice";
    description = "Art is fully subjective! While your rendition borders on neo-dadaist abstraction, it has a distinct aesthetic flair.";
  }

  // Create base64 visualization imagery of user and reference edges
  const edgeVisCanvasU = document.createElement("canvas");
  edgeVisCanvasU.width = commonSize;
  edgeVisCanvasU.height = commonSize;
  const edgeVisCtxU = edgeVisCanvasU.getContext("2d")!;
  const edgeVisImgDataU = edgeVisCtxU.createImageData(commonSize, commonSize);

  const edgeVisCanvasR = document.createElement("canvas");
  edgeVisCanvasR.width = commonSize;
  edgeVisCanvasR.height = commonSize;
  const edgeVisCtxR = edgeVisCanvasR.getContext("2d")!;
  const edgeVisImgDataR = edgeVisCtxR.createImageData(commonSize, commonSize);

  for (let i = 0; i < commonSize * commonSize; i++) {
    const idx = i * 4;
    // Neon Cyan for User Edges
    if (uEdges[i] > 0) {
      edgeVisImgDataU.data[idx] = 6;      // R
      edgeVisImgDataU.data[idx + 1] = 233;  // G
      edgeVisImgDataU.data[idx + 2] = 244;  // B
      edgeVisImgDataU.data[idx + 3] = 255;  // A
    } else {
      // transparent dark
      edgeVisImgDataU.data[idx] = 11;
      edgeVisImgDataU.data[idx + 1] = 11;
      edgeVisImgDataU.data[idx + 2] = 15;
      edgeVisImgDataU.data[idx + 3] = 255;
    }

    // Neon Pink/Magenta for Reference Edges
    if (rEdges[i] > 0) {
      edgeVisImgDataR.data[idx] = 224;     // R
      edgeVisImgDataR.data[idx + 1] = 18;    // G
      edgeVisImgDataR.data[idx + 2] = 139;   // B
      edgeVisImgDataR.data[idx + 3] = 255;   // A
    } else {
      // transparent dark
      edgeVisImgDataR.data[idx] = 11;
      edgeVisImgDataR.data[idx + 1] = 11;
      edgeVisImgDataR.data[idx + 2] = 15;
      edgeVisImgDataR.data[idx + 3] = 255;
    }
  }

  edgeVisCtxU.putImageData(edgeVisImgDataU, 0, 0);
  edgeVisCtxR.putImageData(edgeVisImgDataR, 0, 0);

  return {
    breakdown: {
      ssimScore: Math.round(ssimScore * 10) / 10,
      colorScore: Math.round(colorScore * 10) / 10,
      edgeScore: Math.round(edgeScore * 10) / 10,
      totalScore,
      categoryLabel,
      description
    },
    userEdgesBase64: edgeVisCanvasU.toDataURL("image/png"),
    refEdgesBase64: edgeVisCanvasR.toDataURL("image/png")
  };
}
