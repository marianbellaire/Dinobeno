import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dino be no!",
  description:
    "Side-Scroller-Endless-Runner: als Ankylosaurus, Triceratops oder Stegosaurus dem Jäger entkommen.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dino be no!",
  },
  other: {
    // Next generiert nur das neuere "mobile-web-app-capable" (erst ab iOS 17.4
    // unterstützt) – das ältere Apple-Pendant zusätzlich für iPhones davor.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b8a4a",
  // Kein maximumScale/userScalable:false – Pinch-Zoom bleibt für Barrierefreiheit
  // möglich, das Spielfeld selbst skaliert ohnehin responsiv mit.
  viewportFit: "cover", // damit env(safe-area-inset-*) in GameCanvas.tsx greift
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
