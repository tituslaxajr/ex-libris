import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ex Libris",
    short_name: "Ex Libris",
    description: "Your personal library, alive — catalogue, read, and learn from your books.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe4",
    theme_color: "#a05c2c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
