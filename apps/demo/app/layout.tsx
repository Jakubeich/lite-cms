import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiteCMS Demo",
  description: "Inline editing CMS for React applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
