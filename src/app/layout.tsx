import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, Archivo, Geist_Mono, Hind_Siliguri } from "next/font/google";
import { LocaleProvider } from "@/i18n/provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/types";
import "./globals.css";

// Body: Inter (Wise-like running text) — EN
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Headlines — EN
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

// Bangla UI — Hind Siliguri
const bangla = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  variable: "--font-bangla",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      data-locale={locale}
      className={`${sans.variable} ${display.variable} ${mono.variable} ${bangla.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black font-sans text-white text-[16px] leading-relaxed">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
