/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Painting } from "../types";

import bitterWindsImg from "../assets/images/Bitter Winds VIII - Cathleen Clarke.webp";
import pearlEarringImg from "../assets/images/Girl with Pearl Earring - Johannes Vermeer.webp";
import madonnaImg from "../assets/images/Madonna - Edvard Munch.webp";
import starryNightImg from "../assets/images/Starry Night - Vincent Van Gogh.webp";
import greatWaveImg from "../assets/images/The Great Wave off Kanagawa - Hokusai.webp";
import kissImg from "../assets/images/The Kiss - Gustav Klimt.webp";
import screamImg from "../assets/images/The Scream - Edvard Munch.webp";
import waterLilliesImg from "../assets/images/Water Lillies - Claude Monet .webp";

export const paintings: Painting[] = [
  {
    id: "starry_night",
    name: "Starry Night",
    artist: "Vincent van Gogh",
    year: "1889",
    style: "Post-Impressionism",
    difficulty: "Easy",
    description:
      "An expressive night sky filled with swirling stars above a quiet village and towering cypress trees.",
    category: "landscape",
    imageUrl: starryNightImg,
    authorNote:
      "Focus on the swirling sky patterns and strong contrast between the glowing stars and deep blues."
  },

  {
    id: "the_scream",
    name: "The Scream",
    artist: "Edvard Munch",
    year: "1893",
    style: "Expressionism",
    difficulty: "Easy",
    description:
      "An iconic figure stands on a bridge beneath a dramatic orange sky filled with emotion and movement.",
    category: "portrait",
    imageUrl: screamImg,
    authorNote:
      "Capture the bridge perspective and the dramatic flowing sky."
  },

  {
    id: "great_wave",
    name: "The Great Wave off Kanagawa",
    artist: "Hokusai",
    year: "1831",
    style: "Ukiyo-e",
    difficulty: "Easy",
    description:
      "A giant cresting wave towers over fishing boats while Mount Fuji rests in the distance.",
    category: "landscape",
    imageUrl: greatWaveImg,
    authorNote:
      "Prioritize the wave silhouette and foam details before adding smaller elements."
  },

  {
    id: "water_lillies",
    name: "Water Lillies",
    artist: "Claude Monet",
    year: "1916",
    style: "Impressionism",
    difficulty: "Easy",
    description:
      "A tranquil pond scene with reflections, lily pads, and soft impressionist brushwork.",
    category: "landscape",
    imageUrl: waterLilliesImg,
    authorNote:
      "Layer blues, greens, and purples first, then add highlights and flowers."
  },

  {
    id: "girl_with_pearl_earring",
    name: "Girl with Pearl Earring",
    artist: "Johannes Vermeer",
    year: "1665",
    style: "Baroque",
    difficulty: "Medium",
    description:
      "A young woman looks over her shoulder wearing a blue-and-yellow turban and a luminous pearl earring.",
    category: "portrait",
    imageUrl: pearlEarringImg,
    authorNote:
      "Focus on the dark background, facial lighting, and bright pearl highlight."
  },

  {
    id: "madonna",
    name: "Madonna",
    artist: "Edvard Munch",
    year: "1894",
    style: "Expressionism",
    difficulty: "Medium",
    description:
      "A striking figure framed by flowing forms and dramatic color contrasts.",
    category: "portrait",
    imageUrl: madonnaImg,
    authorNote:
      "Capture the figure's pose and overall color composition before details."
  },

  {
    id: "the_kiss",
    name: "The Kiss",
    artist: "Gustav Klimt",
    year: "1908",
    style: "Art Nouveau",
    difficulty: "Hard",
    description:
      "Two lovers embrace within a field of shimmering gold and intricate decorative patterns.",
    category: "portrait",
    imageUrl: kissImg,
    authorNote:
      "Establish the golden shapes first, then add geometric patterns."
  },

  {
    id: "bitter_winds_viii",
    name: "Bitter Winds VIII",
    artist: "Cathleen Clarke",
    year: "Contemporary",
    style: "Abstract",
    difficulty: "Hard",
    description:
      "An abstract composition featuring expressive movement, layered textures, and bold color transitions.",
    category: "abstract",
    imageUrl: bitterWindsImg,
    authorNote:
      "Focus on large shapes and color relationships rather than exact details."
  }
];

export function getPaintingSrc(painting: Painting): string {
  if (painting.imageUrl) {
    return painting.imageUrl;
  }

  if (painting.svgMarkup) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      painting.svgMarkup
    )}`;
  }

  return "";
}