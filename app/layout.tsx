import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "UpSiteDown - Image Upload Service",
  description: "Upload and share temporary images easily. Upload up to 100 images at once with drag and drop support.",
  keywords: ["image upload", "file sharing", "temporary images", "cloud storage", "image hosting"],
  authors: [{ name: "UpSiteDown" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "UpSiteDown - Image Upload Service",
    description: "Upload and share temporary images easily. Upload up to 100 images at once with drag and drop support.",
    type: "website",
    locale: "en_US",
    siteName: "UpSiteDown",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "UpSiteDown - Image Upload Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UpSiteDown - Image Upload Service",
    description: "Upload and share temporary images easily. Upload up to 100 images at once with drag and drop support.",
    images: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
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
