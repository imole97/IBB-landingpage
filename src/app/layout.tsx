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

// Search results keep the cities (they help local search); anything a
// person sees when the link is shared leaves them out.
const title = `${site.name} — Interior Design Studio | London & Lagos`;
const shareTitle = `${site.name} — Interior Design Studio`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description: site.metaDescription,
  applicationName: site.name,
  // Google ignores keywords; other engines and site tools still read them.
  keywords: [
    "interior design",
    "interior designer London",
    "interior designer Lagos",
    "interior design consultation",
    "space planning",
    "interior procurement",
    "interior project management",
    "residential interior design",
    "commercial interior design",
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
    title: shareTitle,
    description: site.shareDescription,
    emails: [site.email],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: site.shareDescription,
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
  // Ownership tokens for Google Search Console and Bing Webmaster Tools.
  // Set the env vars in Vercel; until then nothing is emitted.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  appleWebApp: { title: site.shortName, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  category: "Interior Design",
};

export const viewport: Viewport = {
  themeColor: "#1A1714",
  colorScheme: "dark",
};

/**
 * Structured data, as one connected graph: the studio, the website that
 * represents it, and this page. WebSite's name is what Google shows as the
 * site name in results; the studio is a ProfessionalService (a kind of
 * LocalBusiness), with its services listed as what it offers.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": absoluteUrl("/#studio"),
      name: site.name,
      alternateName: [site.shortName, "Interiors By B"],
      description: site.description,
      url: site.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
        width: 1179,
        height: 248,
      },
      image: absoluteUrl("/opengraph-image"),
      email: site.email,
      slogan: site.tagline,
      sameAs: [site.instagram],
      areaServed: [
        { "@type": "City", name: "London" },
        { "@type": "City", name: "Lagos" },
        { "@type": "Country", name: "United Kingdom" },
        { "@type": "Country", name: "Nigeria" },
      ],
      address: [
        { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
        { "@type": "PostalAddress", addressLocality: "Lagos", addressCountry: "NG" },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: site.email,
        availableLanguage: ["English"],
      },
      knowsAbout: [
        "Interior design",
        "Residential interior design",
        "Commercial interior design",
        ...site.services,
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Interior design services",
        itemListElement: site.services.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service,
            serviceType: service,
            provider: { "@id": absoluteUrl("/#studio") },
            areaServed: ["London", "Lagos"],
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: site.name,
      alternateName: [site.shortName, "Interiors By B"],
      url: site.url,
      inLanguage: "en-GB",
      publisher: { "@id": absoluteUrl("/#studio") },
    },
    {
      "@type": "WebPage",
      "@id": absoluteUrl("/#webpage"),
      url: site.url,
      name: title,
      description: site.metaDescription,
      inLanguage: "en-GB",
      isPartOf: { "@id": absoluteUrl("/#website") },
      about: { "@id": absoluteUrl("/#studio") },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
      },
    },
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
          <style>{`.rev,.book-hint{opacity:1!important;transform:none!important}.book-scene{display:block!important;overflow:visible!important;touch-action:auto!important}.book-frame{width:auto!important;height:auto!important;aspect-ratio:auto!important}.book-frame::before,.book-frame::after,.book-hint{display:none!important}.book-frame .book-page{position:relative!important;display:block!important;min-height:100dvh;container-type:normal!important}.book-frame .book-page[data-page="2"]{display:none!important}.book-page-content{height:auto!important;min-height:100dvh}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-ink text-paper">{children}</body>
    </html>
  );
}
