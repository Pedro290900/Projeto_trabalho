import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TranslationProvider } from "../contexts/TranslationContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "IA Digital - Transforme Sua Presença Digital",
  description: "Criação de logotipos, websites e estratégias de marketing digital personalizadas com inteligência artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
