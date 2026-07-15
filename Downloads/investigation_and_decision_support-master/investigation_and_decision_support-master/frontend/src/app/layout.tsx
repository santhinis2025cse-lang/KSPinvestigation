import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
// Import Leaflet CSS as a global vendor stylesheet
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "../context/AuthContext";
import { ClientLayoutWrapper } from "../components/ClientLayoutWrapper";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KSP Crime Intelligence Platform",
  description:
    "AI-Powered Investigation & Decision Support System for Karnataka State Police — Datathon 2026",
  keywords: ["Karnataka Police", "Crime Intelligence", "AI Investigation", "SCRB", "KSP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ibmPlex.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#0B0B0F] text-slate-100 flex flex-col font-sans">
        <AuthProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
