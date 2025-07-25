import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PistacheTracker Pro',
  description: 'Suivi complet pour bébés et jeunes parents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                const savedColorScheme = localStorage.getItem('colorScheme');
                const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = savedTheme || 'auto';
                
                let actualTheme;
                if (theme === 'auto') {
                  actualTheme = systemPreference;
                } else {
                  actualTheme = theme;
                }
                
                if (actualTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
                
                // Apply pistacchio forest theme if selected
                if (savedColorScheme === 'pistacchio') {
                  document.documentElement.setAttribute('data-theme', 'forest');
                  document.documentElement.classList.add('theme-forest');
                } else if (savedColorScheme) {
                  document.documentElement.classList.add('theme-' + savedColorScheme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body 
        className={`${inter.className} transition-colors duration-300`}
        style={{
          backgroundColor: 'var(--color-bg, white)',
          color: 'var(--color-text, #1E1E1E)'
        }}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}