import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noddic - Remember Who, Where, What & Why',
  description: 'A visual mind map for everything you want to remember. People, places, ideas, projects — map them out, connect them, never lose track.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Noddic — Remember Who, Where, What & Why',
    description: 'A visual mind map for everything you want to remember.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#3525cd',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}