import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Star Citizen Ops Logistics',
  description: 'Integrated logistics and inventory tooling for Star Citizen organisations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
