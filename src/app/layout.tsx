import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/main.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App User Management & Auth Portal",
  description: "Next.js App with Material UI, Prisma ORM App DB, User CRUD, Login, Forgot & Reset Password",
};

import ThemeRegistry from "@/components/ThemeRegistry";
import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeRegistry>
          <QueryProvider>{children}</QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
