import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Providers } from "./providers";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Glance — A question becomes a dashboard",
  description:
    "Turn a question into a dashboard. Explore revenue, customers and operations with explainable AI selection.",
  icons: { icon: "/glance-mark.svg", apple: "/glance-mark.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.className} min-h-screen`}>
        <TooltipProvider>
          <Providers>{children}</Providers>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
