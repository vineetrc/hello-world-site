import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sticky Note Board",
  description: "A public sticky note board with real physics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
