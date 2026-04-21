import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noddic - Map Your Thinking',
  description: 'A visual mind map to remember the way your brain thinks',
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