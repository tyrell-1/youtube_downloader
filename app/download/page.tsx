"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconArrowLeft,
  IconDownload,
  IconVideo,
  IconMusic,
  IconPlayerPlay,
  IconClock,
  IconEye,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconCalendar,
  IconFileDownload,
  IconSparkles,
  IconDeviceFloppy,
} from "@tabler/icons-react";

interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  height: number;
  width: number;
  filesize: number | null;
  format_type: string;
  quality: number;
  format_note: string;
  tbr?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  view_count: number;
  upload_date: string;
  description: string;
  formats: VideoFormat[];
  ffmpeg_available: boolean;
  video_id: string;
}

interface DownloadProgress {
  id: string;
  filename: string;
  progress: number;
  status: "preparing" | "downloading" | "completed" | "error";
  error?: string;
  totalSize?: number;
  downloadedSize?: number;
  speed?: number;
  eta?: number;
  startTime?: number;
  downloadType?: "video" | "audio";
  thumbnail?: string;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let speed = bytesPerSec;
  let unitIndex = 0;
  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }
  return `${speed.toFixed(1)} ${units[unitIndex]}`;
}

function formatEta(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "--:--";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatViews(views: number): string {
  if (!views) return "0";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

function formatUploadDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return "";
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getQualityBadge(height: number): { label: string; color: string } | null {
  // Use flexible thresholds to accommodate non-standard aspect ratios
  // (e.g., 1012p should be considered FHD-tier, 676p should be HD-tier)
  if (height >= 2000) return { label: "4K", color: "bg-purple-500" };
  if (height >= 1300) return { label: "2K", color: "bg-blue-500" };
  if (height >= 900) return { label: "FHD", color: "bg-green-500" };
  if (height >= 600) return { label: "HD", color: "bg-yellow-500" };
  return null;
}

function normalizeResolution(height: number): string {
  // Normalize non-standard resolutions to their closest standard equivalent
  if (height >= 2000) return "2160p";
  if (height >= 1300) return "1440p";
  if (height >= 900) return "1080p";
  if (height >= 600) return "720p";
  if (height >= 400) return "480p";
  if (height >= 300) return "360p";
  if (height >= 200) return "240p";
  if (height >= 100) return "144p";
  return `${height}p`;
}

// Toast component for download progress
function DownloadToast({
  download,
  onRemove,
}: {
  download: DownloadProgress;
  onRemove: () => void;
}) {
  const isAudio = download.downloadType === "audio";
  
  return (
    <div className="bg-card border rounded-xl shadow-2xl w-[calc(100vw-2rem)] sm:w-80 md:w-96 animate-slide-right overflow-hidden">
      <div className="flex gap-3 p-3 md:p-4">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted">
          {download.thumbnail ? (
            <img
              src={download.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              {isAudio ? (
                <IconMusic className="w-6 h-6 text-muted-foreground" />
              ) : (
                <IconVideo className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
          {/* Type indicator overlay */}
          <div className="absolute bottom-1 right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center">
            {isAudio ? (
              <IconMusic className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary-foreground" />
            ) : (
              <IconVideo className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary-foreground" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-xs md:text-sm font-medium line-clamp-2 leading-tight">
              {download.filename}
            </p>
            {download.status !== "downloading" && download.status !== "preparing" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 md:h-6 md:w-6 shrink-0 -mt-0.5 -mr-1 hover:bg-destructive/10 transition-colors"
                onClick={onRemove}
              >
                <IconX className="w-3 h-3" />
              </Button>
            )}
          </div>

          {download.status === "preparing" && (
            <>
              <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-primary/60 rounded-full animate-pulse w-full" />
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Preparing download...
              </p>
            </>
          )}

          {download.status === "downloading" && (
            <>
              <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${download.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground">
                <span>
                  {download.downloadedSize ? formatFileSize(download.downloadedSize) : "0 B"} /{" "}
                  {download.totalSize ? formatFileSize(download.totalSize) : "..."}
                </span>
                <span className="font-medium text-foreground">{download.progress.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <IconDownload className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  {formatSpeed(download.speed || 0)}
                </span>
                <span>ETA: {formatEta(download.eta || 0)}</span>
              </div>
            </>
          )}

          {download.status === "completed" && (
            <div className="flex items-center gap-1.5 text-green-500">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <IconCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </div>
              <span className="text-[10px] md:text-xs font-medium">Download complete!</span>
            </div>
          )}

          {download.status === "error" && (
            <div className="flex items-center gap-1.5 text-destructive">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                <IconX className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </div>
              <span className="text-[10px] md:text-xs truncate">{download.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  const router = useRouter();
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [showDescription, setShowDescription] = useState(false);
  const speedHistory = useRef<Map<string, number[]>>(new Map());

  useEffect(() => {
    const storedInfo = sessionStorage.getItem("videoInfo");
    const storedUrl = sessionStorage.getItem("videoUrl");

    if (storedInfo && storedUrl) {
      setVideoInfo(JSON.parse(storedInfo));
      setVideoUrl(storedUrl);
    } else {
      router.push("/");
    }
  }, [router]);

  const downloadWithProgress = useCallback(
    async (
      endpoint: string,
      formatId?: string,
      label?: string,
      expectedExt?: string,
      downloadType: "video" | "audio" = "video"
    ) => {
      const downloadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const filename = `${videoInfo?.title || "video"}.${expectedExt || "mp4"}`;

      // Add to downloads list with "preparing" status
      setDownloads((prev) => [
        ...prev,
        {
          id: downloadId,
          filename,
          progress: 0,
          status: "preparing",
          startTime: Date.now(),
          downloadType,
          thumbnail: videoInfo?.thumbnail,
        },
      ]);

      try {
        // Call our server-side API route with the endpoint info
        const requestBody = formatId
          ? { endpoint, url: videoUrl, format_id: formatId }
          : { endpoint, url: videoUrl };

        const response = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 429) {
            throw new Error(data.detail || "Too many requests. Please wait before downloading again.");
          }
          throw new Error(data.detail || "Download failed");
        }

        // Server has started streaming - switch to downloading status
        const contentLength = response.headers.get("Content-Length");
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

        // Get filename from headers
        const xFilename = response.headers.get("X-Filename");
        const actualFilename = xFilename || filename;

        // Update status to downloading with total size
        const startTime = Date.now();
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId
              ? { ...d, status: "downloading", totalSize, filename: actualFilename, startTime }
              : d
          )
        );

        // Read the stream with progress
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const chunks: Uint8Array[] = [];
        let downloadedSize = 0;
        let lastTime = Date.now();
        let lastBytes = 0;
        let lastUIUpdate = 0; // Track last UI update time
        const UI_UPDATE_INTERVAL = 1000; // Update UI every 1 second

        // DEBUG: Throttle download speed to 512KB/s
        const DEBUG_THROTTLE = true;
        const TARGET_SPEED = 512 * 1024; // 512 KB/s
        const CHUNK_INTERVAL = 100; // ms
        const BYTES_PER_INTERVAL = (TARGET_SPEED * CHUNK_INTERVAL) / 1000;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          downloadedSize += value.length;

          const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 50;

          // Calculate speed
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          const bytesDiff = downloadedSize - lastBytes;
          
          let speed = 0;
          if (timeDiff > 0.1) {
            speed = bytesDiff / timeDiff;
            
            // Smooth speed using history
            const history = speedHistory.current.get(downloadId) || [];
            history.push(speed);
            if (history.length > 5) history.shift();
            speedHistory.current.set(downloadId, history);
            speed = history.reduce((a, b) => a + b, 0) / history.length;
            
            lastTime = now;
            lastBytes = downloadedSize;
          }

          // Calculate ETA
          const remainingBytes = (totalSize || 0) - downloadedSize;
          const eta = speed > 0 ? remainingBytes / speed : 0;

          // Only update UI every 1 second (or on first update)
          if (now - lastUIUpdate >= UI_UPDATE_INTERVAL || lastUIUpdate === 0) {
            lastUIUpdate = now;
            setDownloads((prev) =>
              prev.map((d) =>
                d.id === downloadId
                  ? { ...d, progress, downloadedSize, totalSize, speed, eta }
                  : d
              )
            );
          }

          // DEBUG: Add delay to throttle speed
          if (DEBUG_THROTTLE && value.length > 0) {
            const delayMs = (value.length / BYTES_PER_INTERVAL) * CHUNK_INTERVAL;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        // Final UI update to ensure 100% is shown
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId
              ? { ...d, progress: 100, downloadedSize, totalSize, speed: 0, eta: 0 }
              : d
          )
        );

        // Combine chunks and create blob
        const blob = new Blob(chunks as BlobPart[]);
        const downloadUrl = window.URL.createObjectURL(blob);

        // Trigger download
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = actualFilename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        // Clean up speed history
        speedHistory.current.delete(downloadId);

        // Mark as completed
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId
              ? { ...d, progress: 100, status: "completed", downloadedSize: totalSize || downloadedSize }
              : d
          )
        );
      } catch (err) {
        speedHistory.current.delete(downloadId);
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId
              ? {
                  ...d,
                  status: "error",
                  error: err instanceof Error ? err.message : "Download failed",
                }
              : d
          )
        );
      }
    },
    [videoInfo, videoUrl]
  );

  const removeDownload = (id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  if (!videoInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const videoFormats = videoInfo.formats.filter(
    (f) => f.format_type === "video+audio"
  );
  const videoOnlyFormats = videoInfo.formats.filter(
    (f) => f.format_type === "video only"
  );
  const audioFormats = videoInfo.formats.filter(
    (f) => f.format_type === "audio only"
  );

  // Get best formats for quick download - check all formats to find highest quality
  const bestVideoFormat = videoFormats.length > 0 ? videoFormats[0] : null;
  const bestVideoOnlyFormat = videoOnlyFormats.length > 0 ? videoOnlyFormats[0] : null;
  
  // Find the true best quality across all video formats
  const allVideoHeights = [
    ...videoFormats.map(f => f.height),
    ...videoOnlyFormats.map(f => f.height)
  ].filter(h => h > 0);
  const bestQuality = allVideoHeights.length > 0 ? Math.max(...allVideoHeights) : 0;
  const bestQualityBadge = getQualityBadge(bestQuality);

  // Truncate description for preview
  const descriptionLines = videoInfo.description?.split("\n") || [];
  const shortDescription = descriptionLines.slice(0, 3).join("\n");
  const hasMoreDescription = descriptionLines.length > 3;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/")}
            className="transition-all hover:scale-110 active:scale-95"
          >
            <IconArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-sm md:text-base truncate">Download Video</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Video Info Card */}
        <Card className="animate-slide-up p-0">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
              {/* Thumbnail */}
              <div className="relative shrink-0 w-full sm:w-48 md:w-72 lg:w-80">
                <div className="relative aspect-video">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full h-full rounded-lg object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded flex items-center gap-1">
                    <IconClock className="w-3 h-3" />
                    {formatDuration(videoInfo.duration)}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
                <h2 className="text-base md:text-xl font-semibold line-clamp-2">
                  {videoInfo.title}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">{videoInfo.channel}</p>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" className="gap-1 text-xs">
                    <IconEye className="w-3 h-3" />
                    {formatViews(videoInfo.view_count)} views
                  </Badge>
                  {videoInfo.upload_date && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <IconCalendar className="w-3 h-3" />
                      {formatUploadDate(videoInfo.upload_date)}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <IconClock className="w-3 h-3" />
                    {formatDuration(videoInfo.duration)}
                  </Badge>
                </div>

                {/* Description */}
                {videoInfo.description && (
                  <div className="mt-2 md:mt-3">
                    <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-line">
                      {showDescription ? videoInfo.description : shortDescription}
                    </p>
                    {hasMoreDescription && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-xs px-2 gap-1"
                        onClick={() => setShowDescription(!showDescription)}
                      >
                        {showDescription ? (
                          <>
                            <IconChevronUp className="w-3 h-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <IconChevronDown className="w-3 h-3" />
                            Show more
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Download */}
        <Card className="border-primary/50 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <IconSparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Quick Download
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Download in best available quality with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Best Video */}
              <div className="p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <IconVideo className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm md:text-base">Best Video (MP4)</span>
                  {bestQualityBadge && (
                    <Badge className={`${bestQualityBadge.color} text-white text-xs`}>
                      {bestQualityBadge.label}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {normalizeResolution(bestQuality)} • Video with audio • Ready to play
                </p>
                <Button
                  onClick={() =>
                    downloadWithProgress("/api/download-best", undefined, "best", "mp4", "video")
                  }
                  className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  size="sm"
                >
                  <IconDownload className="w-4 h-4" />
                  Download Video
                </Button>
              </div>

              {/* Audio Only */}
              <div className="p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <IconMusic className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm md:text-base">
                    Audio Only ({videoInfo.ffmpeg_available ? "MP3" : "M4A"})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {videoInfo.ffmpeg_available ? "Converted to MP3" : "Original M4A"} • Music/Podcast
                </p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadWithProgress(
                      "/api/download-audio",
                      undefined,
                      "audio",
                      videoInfo.ffmpeg_available ? "mp3" : "m4a",
                      "audio"
                    )
                  }
                  className="w-full gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  size="sm"
                >
                  <IconDownload className="w-4 h-4" />
                  Download Audio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video+Audio Formats */}
        {videoFormats.length > 0 && (
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <IconPlayerPlay className="w-4 h-4 md:w-5 md:h-5" />
                Video + Audio
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Ready to play - no merging required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {videoFormats.map((format) => {
                  const qualityBadge = getQualityBadge(format.height);
                  return (
                    <div
                      key={format.format_id}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 gap-2"
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap min-w-0">
                        <Badge variant="default" className="text-xs shrink-0">
                          {format.ext.toUpperCase()}
                        </Badge>
                        {qualityBadge && (
                          <Badge className={`${qualityBadge.color} text-white text-xs shrink-0`}>
                            {qualityBadge.label}
                          </Badge>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{normalizeResolution(format.height)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format.fps && `${format.fps}fps`}
                            {format.filesize && ` • ${formatFileSize(format.filesize)}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 shrink-0 h-8 px-2 md:px-3 transition-all hover:scale-105 active:scale-95"
                        onClick={() =>
                          downloadWithProgress(
                            "/api/download",
                            format.format_id,
                            format.format_id,
                            format.ext,
                            "video"
                          )
                        }
                      >
                        <IconDownload className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Only Formats */}
        {videoOnlyFormats.length > 0 && (
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <IconVideo className="w-4 h-4 md:w-5 md:h-5" />
                Video Only
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Higher quality video streams (no audio)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {videoOnlyFormats.map((format) => {
                  const qualityBadge = getQualityBadge(format.height);
                  return (
                    <div
                      key={format.format_id}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 gap-2"
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap min-w-0">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {format.ext.toUpperCase()}
                        </Badge>
                        {qualityBadge && (
                          <Badge className={`${qualityBadge.color} text-white text-xs shrink-0`}>
                            {qualityBadge.label}
                          </Badge>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{normalizeResolution(format.height)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format.fps && `${format.fps}fps`}
                            {format.filesize && ` • ${formatFileSize(format.filesize)}`}
                            {format.vcodec && ` • ${format.vcodec.split(".")[0]}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 shrink-0 h-8 px-2 md:px-3 transition-all hover:scale-105 active:scale-95"
                        onClick={() =>
                          downloadWithProgress(
                            "/api/download",
                            format.format_id,
                            format.format_id,
                            format.ext,
                            "video"
                          )
                        }
                      >
                        <IconDownload className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Formats */}
        {audioFormats.length > 0 && (
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <IconMusic className="w-4 h-4 md:w-5 md:h-5" />
                Audio Only
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Audio streams in various qualities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {audioFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 gap-2"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {format.ext.toUpperCase()}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {format.tbr ? `${Math.round(format.tbr)} kbps` : "Audio"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format.acodec && format.acodec.split(".")[0]}
                          {format.filesize && ` • ${formatFileSize(format.filesize)}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0 h-8 px-2 md:px-3 transition-all hover:scale-105 active:scale-95"
                      onClick={() =>
                        downloadWithProgress(
                          "/api/download",
                          format.format_id,
                          format.format_id,
                          format.ext,
                          "audio"
                        )
                      }
                    >
                      <IconDownload className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Download Toasts - Bottom Right */}
      {downloads.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 space-y-2 max-h-[calc(100vh-2rem)] overflow-y-auto">
          {downloads.map((download) => (
            <DownloadToast
              key={download.id}
              download={download}
              onRemove={() => removeDownload(download.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
