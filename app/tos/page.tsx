import type { Metadata } from "next";
import { IconScale, IconAlertTriangle, IconGavel } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for YT Downloader. Learn about acceptable use, copyright policies, and user responsibilities.",
  openGraph: {
    title: "Terms of Service - YT Downloader",
    description:
      "Read the Terms of Service for YT Downloader. Learn about acceptable use and user responsibilities.",
  },
  alternates: {
    canonical: "/tos",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <IconScale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 9, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
          {/* Acceptance */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                1
              </span>
              Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using YT Downloader ("the Service"), you accept
              and agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use the Service.
            </p>
          </section>

          {/* Description */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                2
              </span>
              Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              YT Downloader provides a tool that allows users to download videos
              and audio from YouTube for personal, non-commercial use. The
              Service is provided "as is" and we make no guarantees about its
              availability or functionality.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                3
              </span>
              Acceptable Use
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in
              accordance with these Terms. You agree NOT to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Download copyrighted content without permission from the
                copyright holder
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Use downloaded content for commercial purposes without proper
                licensing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Redistribute, sell, or share downloaded content illegally
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Attempt to circumvent any rate limiting or security measures
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">•</span>
                Use automated scripts or bots to access the Service excessively
              </li>
            </ul>
          </section>

          {/* Copyright Warning */}
          <section className="p-6 rounded-xl border border-destructive/50 bg-destructive/5">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="w-6 h-6" />
              Copyright Notice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Downloading copyrighted material without permission may violate
              copyright laws in your country. You are solely responsible for
              ensuring that your use of the Service complies with all applicable
              laws and regulations. We do not condone or encourage copyright
              infringement.
            </p>
          </section>

          {/* User Responsibility */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                4
              </span>
              User Responsibility
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for your use of the Service and any
              content you download. You agree to indemnify and hold harmless the
              Service operators from any claims, damages, or expenses arising
              from your use of the Service or violation of these Terms.
            </p>
          </section>

          {/* Limitations */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                5
              </span>
              Service Limitations
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To ensure fair usage for all users, the Service implements the
              following limitations:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Maximum 20 downloads per hour per user
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Maximum 3 concurrent downloads
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Rate limiting on API requests
              </li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                6
              </span>
              Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND,
              EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE
              UNINTERRUPTED, SECURE, OR ERROR-FREE. USE OF THE SERVICE IS AT
              YOUR OWN RISK.
            </p>
          </section>

          {/* Changes */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                7
              </span>
              Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes
              will be effective immediately upon posting. Your continued use of
              the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="p-6 rounded-xl border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <IconGavel className="w-6 h-6 text-primary" />
              Questions?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us through our website. By using the Service, you
              acknowledge that you have read, understood, and agree to be bound
              by these Terms.
            </p>
          </section>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button variant="outline" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
