import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "YT Downloader - Free YouTube Video & Audio Downloader",
    template: "%s | YT Downloader",
  },
  description:
    "Download YouTube videos and audio for free in HD, Full HD, and 4K quality. Fast, secure, and easy-to-use YouTube downloader with MP3 and MP4 support.",
  keywords: [
    "YouTube downloader",
    "download YouTube videos",
    "YouTube to MP3",
    "YouTube to MP4",
    "free YouTube downloader",
    "HD video download",
    "4K YouTube download",
    "YouTube audio download",
    "video downloader",
    "online YouTube downloader",
  ],
  authors: [{ name: "YT Downloader" }],
  creator: "YT Downloader",
  publisher: "YT Downloader",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "YT Downloader",
    title: "YT Downloader - Free YouTube Video & Audio Downloader",
    description:
      "Download YouTube videos and audio for free in HD, Full HD, and 4K quality. Fast, secure, and easy-to-use.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YT Downloader - Free YouTube Video Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YT Downloader - Free YouTube Video & Audio Downloader",
    description:
      "Download YouTube videos and audio for free in HD, Full HD, and 4K quality.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
