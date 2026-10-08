import type { Metadata, Viewport } from "next";
import { Inter, Archivo, Geist_Mono } from "next/font/google";
import "./globals.css";

// Body: Inter (what Wise uses for running text)
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Headlines: ultra-heavy wide grotesque, closest free match to Wise Sans
const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "variable",
  axes: ["wdth"],
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "iCash Exchange",
    template: "%s · iCash Exchange",
  },
  description:
    "iCash Exchange is a digital voucher desk. Choose a note, pay, and read the code on your order page.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "iCash Exchange",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-black font-sans text-white text-[16px] leading-relaxed">{children}</body>
    </html>
  );
}
