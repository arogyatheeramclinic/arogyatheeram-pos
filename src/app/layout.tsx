import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { ClinicProvider } from '@/context/ClinicContext';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-sans',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Arogya Theeram | Ayurvedic Clinic & POS System',
  description: 'Ayurvedic Clinic Management, Electronic Medical Records, Pharmacy & Point of Sale System',
  keywords: ['Ayurveda', 'Clinic Management', 'POS', 'EMR', 'Pharmacy Billing', 'Kerala Ayurveda'],
  icons: {
    icon: [\n      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
        <ClinicProvider>
          {children}
        </ClinicProvider>
      </body>
    </html>
  );
}
