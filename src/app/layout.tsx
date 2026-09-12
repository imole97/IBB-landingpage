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
    <html lang="en-GB" className={`${comfortaa.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          // Static object under our control — no user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Without JS the loader never lifts and the reveal never fires —
            so drop both and show the page as-is. */}
        <noscript>
          <style>{`.rev{opacity:1 !important;transform:none !important}[data-loader]{display:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-ink text-paper">{children}</body>
    </html>
  );
}
