import type { Metadata } from 'next';
import { Fredoka, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/LanguageContext';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'न्याय Mitra — Digital Justice & Legal Empowerment Portal',
  description:
    'न्याय Mitra is a modern AI-powered legal-tech platform for Nepal. Anonymous incident reporting, AI legal assistant, case tracking, community support, and verified lawyer access.',
  keywords: 'legal aid nepal, nyaya mitra, AI legal assistant, citizen rights, complaint filing nepal',
  openGraph: {
    title: 'न्याय Mitra — Your Trusted Legal Companion',
    description: 'Empowering citizens with accessible legal knowledge and AI-powered guidance.',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${notoDevanagari.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script: theme flicker prevention — DEFAULT is LIGHT */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('nyaya-theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-brand-50 dark:bg-legal-navy-dark text-[#0B192C] dark:text-[#EBF4FF] transition-colors duration-300">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
