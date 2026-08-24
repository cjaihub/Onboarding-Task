import type { Metadata } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

const ubuntuSans = Ubuntu({
  variable: "--font-geist-sans", // Keeping variable name to avoid breaking tailwind config if mapped
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const ubuntuMono = Ubuntu_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

import { Providers } from "../components/Providers";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { CommandPalette } from "../components/CommandPalette";
import { MobileNavigation } from "../components/MobileNavigation";

export const metadata: Metadata = {
  title: "Usalama Tasks",
  description: "Internal Incident & Work Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${ubuntuSans.variable} ${ubuntuMono.variable} h-full antialiased`}
    >
      <body className="h-full flex overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)] transition-colors duration-200">
        <Providers>
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
            <Header />
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--surface-base)]">
              <div className="mx-auto max-w-7xl p-4 md:p-8">
                {children}
              </div>
            </main>
          </div>
          <CommandPalette />
          <MobileNavigation />
        </Providers>
      </body>
    </html>
  );
}
