import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noddic — Map Your People & Places',
  description: 'A visual mind map to remember the people and places in your life.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}