import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeMtaani Group | Think. Build. Transform.",
    template: "%s | CodeMtaani Group",
  },
  description:
    "A Kenyan-rooted technology group building digital products, delivering technology services and advancing innovation across Africa.",
  applicationName: "CodeMtaani Group",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}