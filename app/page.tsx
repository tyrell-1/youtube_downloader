"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconBrandYoutube,
  IconDownload,
  IconClipboard,
  IconVideo,
  IconMusic,
  IconSparkles,
  IconBolt,
} from "@tabler/icons-react";
import JsonLd, {
  websiteJsonLd,
  softwareAppJsonLd,
  faqJsonLd,
} from "@/components/JsonLd";

// YouTube URL validation patterns
const YOUTUBE_PATTERNS = [
  /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/v\/[\w-]+/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  /^(https?:\/\/)?youtu\.be\/[\w-]+/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[\w-]+/,
];

function isValidYouTubeUrl(url: string): boolean {
  if (!url.trim()) return false;
  return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url.trim()));
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(null);
    setError(null);
    if (value.trim() && !isValidYouTubeUrl(value)) {
      setUrlError("Please enter a valid YouTube URL");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;

    if (!isValidYouTubeUrl(url)) {
      setUrlError("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call our server-side API route (not the backend directly)
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.detail || "Too many requests. Please slow down.");
        }
        if (data.detail && Array.isArray(data.detail)) {
          throw new Error(data.detail[0]?.msg || "Invalid request");
        }
        throw new Error(data.detail || "Failed to fetch video info");
      }

      // Store video info in sessionStorage and navigate to results
      sessionStorage.setItem("videoInfo", JSON.stringify(data));
      sessionStorage.setItem("videoUrl", url.trim());
      router.push("/download");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16">
          {/* Logo and Title */}
          <div className="text-center mb-8 md:mb-12 animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-red-500/10 mb-4 md:mb-6 transition-transform hover:scale-110">
              <IconBrandYoutube className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4">
              YouTube Downloader
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto px-4">
              Download videos and audio from YouTube instantly
            </p>
          </div>

        {/* Search Box */}
        <div className="w-full max-w-xl px-4 md:px-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex flex-col sm:flex-row gap-2 bg-card border rounded-xl md:rounded-2xl p-2 shadow-lg transition-shadow hover:shadow-xl">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="Paste YouTube link here..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !urlError && handleSubmit()}
                className={`h-10 md:h-11 text-sm md:text-base pr-10 ${urlError ? "border-destructive" : "border-0 bg-muted/50"}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePaste}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 md:h-8 md:w-8 hover:bg-primary/10 transition-all hover:scale-110 active:scale-95"
                title="Paste from clipboard"
              >
                <IconClipboard className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || !url.trim() || !!urlError}
              size="default"
              className="h-10 md:h-11 px-4 md:px-5 gap-2 w-full sm:w-auto transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
            >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <IconDownload className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Download</span>
                  </>
                )}
            </Button>
          </div>

          {urlError && (
            <p className="text-sm text-destructive mt-2 px-1">{urlError}</p>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mt-3">
              {error}
            </div>
          )}

          {/* Supported formats hint */}
          <p className="text-xs md:text-sm text-muted-foreground text-center mt-3 md:mt-4">
            Supports youtube.com, youtu.be, shorts, and live videos
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-12 md:mt-16 max-w-4xl w-full px-4">
          <div className="flex flex-col items-center p-4 md:p-6 rounded-xl bg-card/50 border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
              <IconVideo className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">Multiple Formats</h3>
            <p className="text-xs md:text-sm text-muted-foreground text-center mt-1">
              MP4, WebM, M4A
            </p>
          </div>

          <div className="flex flex-col items-center p-4 md:p-6 rounded-xl bg-card/50 border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
              <IconSparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">Up to 4K</h3>
            <p className="text-xs md:text-sm text-muted-foreground text-center mt-1">
              Best quality available
            </p>
          </div>

          <div className="flex flex-col items-center p-4 md:p-6 rounded-xl bg-card/50 border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
              <IconMusic className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">Audio Extract</h3>
            <p className="text-xs md:text-sm text-muted-foreground text-center mt-1">
              MP3, M4A, Opus
            </p>
          </div>

          <div className="flex flex-col items-center p-4 md:p-6 rounded-xl bg-card/50 border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 md:mb-3">
              <IconBolt className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm md:text-base">Fast Download</h3>
            <p className="text-xs md:text-sm text-muted-foreground text-center mt-1">
              Direct streaming
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
        <footer className="py-4 md:py-6 text-center text-xs md:text-sm text-muted-foreground border-t">
          <p>For personal use only. Respect copyright laws.</p>
        </footer>
      </div>
    </>
  );
}
