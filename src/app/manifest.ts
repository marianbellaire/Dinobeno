import type { MetadataRoute } from "next";

// Nötig für den Static Export (output: "export", siehe next.config.ts) – ohne das
// bricht `next build`, weil Next sonst eine dynamische Route erwartet.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dino be no!",
    short_name: "Dino be no!",
    description:
      "Side-Scroller-Endless-Runner: als Ankylosaurus, Triceratops oder Stegosaurus dem Jäger entkommen.",
    start_url: "/",
    display: "standalone",
    background_color: "#bfe6ff", // Himmel-Farbe aus dem Spiel (siehe draw.ts)
    theme_color: "#5b8a4a", // Ankylosaurus-Grün
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
