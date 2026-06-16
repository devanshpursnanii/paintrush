# 🎨 PaintRush

Recreate iconic masterpieces against the clock and let computer vision judge your artistic accuracy.

PaintRush is a browser-based speed painting game where players are given a famous artwork and 3 minutes to recreate it using a digital canvas. Once time expires, the drawing is automatically evaluated using image similarity algorithms running entirely in the browser.

No accounts. No uploads. No server-side image processing.

---

## 🚀 Live Demo

**Play here:** paintrush.vercel.app

## 🎮 How It Works

1. A famous painting is selected at random.
2. Players get **3 minutes** to recreate it.
3. Use the drawing canvas, brush controls, color palette, and fill tool.
4. When the timer ends, the artwork is frozen.
5. Computer vision algorithms compare the original and recreated versions.
6. A score out of 10 is generated.
7. Share your result card with friends.

---

## 🖼 Included Paintings

* Starry Night — Vincent van Gogh
* The Scream — Edvard Munch
* Girl with a Pearl Earring — Johannes Vermeer
* Water Lilies — Claude Monet
* The Great Wave off Kanagawa — Hokusai
* The Kiss — Gustav Klimt
* Madonna — Edvard Munch
* Bitter Winds VIII — Cathleen Clarke
* ...and more coming soon!

---

## ✨ Features

* Random painting selection
* 3-minute speedrun mode
* Responsive layout for desktop and mobile
* Brush tool
* Eraser tool
* Paint bucket fill tool
* Adjustable brush size
* Opacity controls
* Hue, saturation, and brightness mixer
* Undo / Redo history
* Shareable results screen
* Client-side computer vision scoring

---

## 🧠 Evaluation System

All scoring runs directly inside the browser.

The evaluation combines:

* Structural Similarity (SSIM)
* Color histogram comparison
* Edge detection similarity

Final scores are generated using a weighted combination of these metrics.

No artwork is uploaded to any server.

---

## 🛠 Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Image Analysis

* OpenCV.js

### Deployment

* Vercel

---

## 📱 Responsive Design

### Mobile

* Painting reference on top
* Drawing canvas below

### Desktop

* Side-by-side reference and canvas layout

---

## 🏗 Local Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## 📂 Project Structure

```text
src/
├── assets/
│   └── images/
├── components/
├── data/
│   └── paintings.ts
├── lib/
│   └── cvEvaluation.ts
├── App.tsx
├── main.tsx
└── types.ts
```

---

## 🎯 Future Ideas

* Daily challenge mode
* Global leaderboard
* Multiplayer painting battles
* Tournament brackets
* Additional painting packs
* AI-generated challenge artworks

---

## 👨‍💻 Author

Made with ❤️ by Devansh Pursnani

If you enjoyed PaintRush, consider starring the repository.
