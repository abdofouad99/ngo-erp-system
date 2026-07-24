import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "جمعية اليتامى التنموية | ORPHANS DEVELOPMENT",
  description: "النظام الإلكتروني الشامل لإدارة المستفيدين والأيتام والمشاريع والكفالات — جمعية اليتامى التنموية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
