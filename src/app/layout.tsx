import type { Metadata } from "next";
import { Bitter, Hind_Siliguri } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const display = Bitter({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Hind_Siliguri({ variable: "--font-body-face", subsets: ["latin", "bengali"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Leave Register",
  description: "Apply for leave, review applications and track balances.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
