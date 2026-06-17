import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "מודל נתונים — תרשים ER",
  description: "מערכת לבניית מודל נתונים אינטראקטיבי עם טבלאות, קשרים ו-RLS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${roboto.variable} font-sans antialiased bg-theme-page text-theme-text`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
