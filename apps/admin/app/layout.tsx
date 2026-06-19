import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HKBP CMS",
  description: "Admin CMS HKBP Resort Srengseng Sawah",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
