import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/dashboard/sidebar";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GEO Dashboard | 主要LLMブランド可視性レポート",
  description:
    "ChatGPT、Gemini、Google AIモード、Claude における自社ブランドの言及状況・引用元・紹介内容を一画面で把握するGEOダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="flex h-full bg-background font-sans text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
