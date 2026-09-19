import type { Metadata, Viewport } from "next";
import { Comfortaa } from "next/font/google";
import { site, absoluteUrl } from "@/lib/site";
import "./globals.css";

// Replaces the prototype's render-blocking @import from fonts.googleapis.com:
// Next self-hosts the file, so there's no third-party request and no CLS.
const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Interior Design Studio | London & Lagos`,
    template: `%s | ${site.name}`,
  },
  description: site.metaDescription,
  applicationName: site.name,
  keywords: [
    "interior design",
    "interior designer London",
    "interior designer Lagos",
    "residential interior design",
    "commercial interior design",
    "e-design",
    "Nigeria interior design",
    "Interiors By B",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Interior Design Studio | London & Lagos`,
    description: site.metaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Interior Design Studio | London & Lagos`,
    description: site.metaDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "Interior Design",
};

export const viewport: Viewport = {
  themeColor: "#1A1714",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["InteriorDesign", "LocalBusiness"],
  "@id": absoluteUrl("/#studio"),
  name: site.name,
  alternateName: "IBB",
  description: site.description,
  url: site.url,
  logo: absoluteUrl("/logo.png"),
  image: absoluteUrl("/opengraph-image"),
  email: site.email,
  slogan: site.tagline,
  sameAs: [site.instagram],
  areaServed: [
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "Nigeria" },
  ],
  address: [
    { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
    { "@type": "PostalAddress", addressLocality: "Lagos", addressCountry: "NG" },
  ],
  knowsAbout: [
    "Residential interior design",
    "Commercial interior design",
    "E-design",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${comfortaa.variable} antialiased`}
      // Inline so the ink is painted the moment the HTML parses. The
      // stylesheet is render-blocking, and its arrival is the difference
      // between a dark first frame and a white flash on a dark site.
      style={{ backgroundColor: "#1A1714" }}
    >
      <head>
        <script
          type="application/ld+json"
          // Static object under our control — no user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Without JS page-flip never mounts, so there's nothing to turn.
            Lay the cover and the About page out as an ordinary scrolling
            document instead — every word readable — and keep the
            thank-you out of it, since it can't be reached. */}
        <noscript>
          <style>{`.rev,.book-hint{opacity:1!important;transform:none!important}.book-scene{display:block!important;overflow:visible!important;touch-action:auto!important}.book-frame{width:auto!important;height:auto!important;aspect-ratio:auto!important}.book-frame::before,.book-frame::after,.book-hint{display:none!important}.book-frame .book-page{position:relative!important;display:block!important;min-height:100dvh}.book-frame .book-page[data-page="2"]{display:none!important}.book-page-content{height:auto!important;min-height:100dvh}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-ink text-paper">{children}</body>
    </html>
  );
}
