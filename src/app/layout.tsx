import type { Metadata } from "next";
import { Foldit, Happy_Monkey } from "next/font/google";
import "./globals.css";

const foldit = Foldit({ subsets: ["latin"], variable: "--font-foldit", display: "swap" });
const happyMonkey = Happy_Monkey({ weight: "400", subsets: ["latin"], variable: "--font-happy-monkey", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CodeMtaani Group | Think. Build. Transform.", template: "%s | CodeMtaani Group" },
  description: "A Kenyan-rooted technology group building digital products, delivering technology services and advancing innovation across Africa.",
  applicationName: "CodeMtaani Group",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${foldit.variable} ${happyMonkey.variable}`}>{children}</body></html>;
}
