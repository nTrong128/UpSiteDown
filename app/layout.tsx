import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#7c3aed" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "UpSiteDown - Image Upload Service",
    template: "%s | UpSiteDown"
  },
  description: "Upload and share temporary images easily. Upload up to 100 images at once with drag and drop support.",
  keywords: ["image upload", "file sharing", "temporary images", "cloud storage", "image hosting", "drag and drop", "free image hosting"],
  authors: [{ name: "UpSiteDown" }],
  creator: "UpSiteDown",
  publisher: "UpSiteDown",
  applicationName: "UpSiteDown",
  category: "Technology",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  openGraph: {
    title: "UpSiteDown - Image Upload Service",
    description: "Upload and share temporary images easily. Upload up to 100 images at once with drag and drop support.",
    type: "website",
    locale: "en_US",
    siteName: "UpSiteDown",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "UpSiteDown - Upload and share images easily",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UpSiteDown - Image Upload Service",
    description: "Upload and share temporary images easily. Upload up to 100 images at once with drag and drop support.",
    creator: "@upsitedown",
    site: "@upsitedown",
    images: ["/og-image.svg"],
  },
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
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  other: {
    "theme-color": "#7c3aed",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
