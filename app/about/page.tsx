import type { Metadata } from "next";
import {
  IconBrandYoutube,
  IconDownload,
  IconShieldCheck,
  IconRocket,
  IconCode,
  IconHeart,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about YT Downloader - a free, fast, and secure tool to download YouTube videos and audio in HD, Full HD, and 4K quality.",
  openGraph: {
    title: "About YT Downloader",
    description:
      "Learn about YT Downloader - a free, fast, and secure tool to download YouTube videos and audio.",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-red-500/10 mb-6">
            <IconBrandYoutube className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            About YT Downloader
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A simple, fast, and free tool to download YouTube videos and audio
            for personal use.
          </p>
        </div>

        {/* Features */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <IconDownload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Multiple Formats</h3>
              <p className="text-muted-foreground">
                Download videos in MP4, WebM, or extract audio in MP3 and M4A
                formats. Choose the quality that suits your needs.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <IconRocket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fast Downloads</h3>
              <p className="text-muted-foreground">
                Direct streaming from YouTube servers means fast download speeds
                with no waiting in queues.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <IconShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Privacy Focused</h3>
              <p className="text-muted-foreground">
                We don't store your downloads or track your activity. Your
                privacy matters to us.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <IconCode className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Modern Technology</h3>
              <p className="text-muted-foreground">
                Built with Next.js and FastAPI for a smooth, responsive
                experience on any device.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Paste the URL</h3>
                <p className="text-muted-foreground text-sm">
                  Copy the YouTube video URL and paste it into the search box on
                  our homepage.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Choose Format</h3>
                <p className="text-muted-foreground text-sm">
                  Select your preferred video quality or audio format from the
                  available options.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-lg border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Download</h3>
                <p className="text-muted-foreground text-sm">
                  Click download and watch the progress. Your file will be saved
                  automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-12 md:mb-16 p-6 rounded-xl border bg-muted/50">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <IconHeart className="w-5 h-5 text-primary" />
            Important Notice
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This tool is intended for personal use only. Please respect
            copyright laws and YouTube's Terms of Service. Only download content
            that you have the right to download, such as videos you've uploaded
            or content that is in the public domain. We are not responsible for
            any misuse of this tool.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <IconDownload className="w-5 h-5" />
              Start Downloading
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
