import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import SoundProvider from '@/components/SoundProvider';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
  title: 'ファイブリーグ',
  description: '5文字で答える！みんなで1文字ずつ手書き',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="min-h-screen antialiased font-sans">
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
