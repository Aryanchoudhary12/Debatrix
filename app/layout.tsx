import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Poppins,
  Montserrat,
  Fascinate_Inline,
} from "next/font/google";
import "./globals.css";
import MeteorShowerPage from "./components/ui/bg";
import ThemeProvider from "./providers/themeProvider";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import ServerProvider from "./providers/serverProvider";
import Header from "./components/layouts/navbar";
import {Providers} from "./providers/appoloProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const fascinateInline = Fascinate_Inline({
  variable: "--font-fascinate-inline",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Debatrix",
  description: "An AI-powered platform for debating and discussing ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${montserrat.variable} ${fascinateInline.variable} h-full antialiased`}
    >
      <ThemeProvider />

      <SessionProvider>
        <ServerProvider>
          <Providers>
            <body className="relative">
              <div className="absolute inset-0 -z-10 h-full">
                <MeteorShowerPage />
              </div>
              <main className="relative z-10 flex flex-col h-full ">
                <Header />
                <div className="flex-1 flex h-full min-h-screen">
                  {children}
                </div>
              </main>
              <Toaster />
            </body>
          </Providers>
        </ServerProvider>
      </SessionProvider>
    </html>
  );
}
