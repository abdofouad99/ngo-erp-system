import type { Metadata } from "next";
import { Cairo, Almarai } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('ngo_theme');
                  if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${cairo.variable} ${almarai.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
