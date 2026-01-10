import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'לימוד אנגלית לילדים',
  description: 'אפליקציה ללימוד אוצר מילים באנגלית',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
