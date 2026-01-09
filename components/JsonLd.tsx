interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "YT Downloader",
  description:
    "Download YouTube videos and audio for free in HD, Full HD, and 4K quality.",
  url: "https://ytdownloader.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://ytdownloader.com/?url={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "YT Downloader",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free online tool to download YouTube videos in HD, Full HD, and 4K quality. Convert YouTube to MP3 or MP4.",
  featureList: [
    "Download YouTube videos in HD, Full HD, and 4K",
    "Extract audio as MP3",
    "Fast and secure downloads",
    "No registration required",
    "Free to use",
  ],
};

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I download a YouTube video?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Simply paste the YouTube video URL into the input field, select your preferred quality and format, then click download. The video will be saved to your device.",
      },
    },
    {
      "@type": "Question",
      name: "Is YT Downloader free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, YT Downloader is completely free to use. There are no hidden fees or subscriptions required.",
      },
    },
    {
      "@type": "Question",
      name: "What video qualities are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "YT Downloader supports multiple video qualities including 360p, 480p, 720p (HD), 1080p (Full HD), 1440p (2K), and 2160p (4K) when available.",
      },
    },
    {
      "@type": "Question",
      name: "Can I download audio only?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can extract audio from YouTube videos and download them in various audio formats and bitrates.",
      },
    },
    {
      "@type": "Question",
      name: "Is it legal to download YouTube videos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Downloading videos for personal, non-commercial use may be permitted in some jurisdictions. However, downloading copyrighted content without permission may violate copyright laws. Always respect content creators' rights.",
      },
    },
  ],
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "YT Downloader",
  url: "https://ytdownloader.com",
  logo: "https://ytdownloader.com/icon-512.png",
  sameAs: [],
};
