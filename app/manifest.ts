import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YT Downloader - Free YouTube Video Downloader",
    short_name: "YT Downloader",
    description:
      "Download YouTube videos and audio for free in HD, Full HD, and 4K quality. Fast, secure, and easy-to-use.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#dc2626",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
