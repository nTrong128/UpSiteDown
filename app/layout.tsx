import type { Metadata } from "next";
import "./globals.css";
import { EdgeStoreProvider } from "@/lib/edgestore-context";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "UpSiteDown - Image Upload Service",
  description: "A site to upload temporary images to download from somewhere else.",
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
          <EdgeStoreProvider>{children}</EdgeStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
