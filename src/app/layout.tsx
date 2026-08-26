import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Calendar AI",
  description: "Instantly turn emails, notes, and unstructured text into Google Calendar events using AI.",
  openGraph: {
    title: "Calendar AI",
    description: "The intelligent way to schedule. Turn unstructured text into Google Calendar events instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendar AI",
    description: "The intelligent way to schedule. Turn unstructured text into Google Calendar events instantly.",
  }
};

import { Providers } from "./providers";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
