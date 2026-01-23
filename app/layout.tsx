import type { Metadata } from "next";
import "./globals.css";
import { EdgeStoreProvider } from "@/lib/edgestore-context";

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
    <html lang="en">
      <body className="antialiased">
        <EdgeStoreProvider>{children}</EdgeStoreProvider>
      </body>
    </html>
  );
}
