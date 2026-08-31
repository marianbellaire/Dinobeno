import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statischer Export für GitHub Pages – die App ist rein clientseitig
  // (Canvas-Spiel, kein Server-Code nötig), daher unproblematisch.
  output: "export",
};

export default nextConfig;
