import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Seyi Adeleye | Backend Engineer",
    template: "%s | Seyi Adeleye"
  },
  description: "Backend engineer focused on building reliable systems and infrastructure. Specialized in Go, TypeScript, and distributed systems.",
  keywords: ["Seyi Adeleye", "Backend Engineer", "Software Engineer", "Go", "TypeScript", "Node.js", "Lagos", "Nigeria", "Portfolio"],
  authors: [{ name: "Seyi Adeleye" }],
  creator: "Seyi Adeleye",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://seyiadeleye.up.railway.app",
    title: "Seyi Adeleye | Backend Engineer",
    description: "Backend engineer focused on building reliable systems and infrastructure.",
    siteName: "Seyi Adeleye Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seyi Adeleye | Backend Engineer",
    description: "Backend engineer focused on building reliable systems and infrastructure.",
    creator: "@seyiadel",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
