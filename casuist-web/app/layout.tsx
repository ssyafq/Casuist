import type { Metadata } from 'next'
import { DM_Sans, DM_Mono, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
})
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
})

export const metadata: Metadata = {
  title: 'Casuist — Clinical Case Training',
  description: 'Practice real patient cases. Build diagnostic intuition. Get AI-grounded feedback with PubMed citations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} ${dmSerif.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
