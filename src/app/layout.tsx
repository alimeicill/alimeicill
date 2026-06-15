import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppLayout } from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SiteYönetim - Modern Site ve Apartman Yönetim Platformu',
  description:
    'Site ve apartman yönetimi için modern, güvenli ve kullanıcı dostu SaaS platformu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AppLayout>{children}</AppLayout>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
