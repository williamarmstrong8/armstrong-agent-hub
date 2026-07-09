import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "life-hub — your personal operating system",
  description:
    "A single hub to visualize and connect every aspect of your life: home search, health, work, and automations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
