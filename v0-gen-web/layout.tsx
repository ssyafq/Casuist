import type { Metadata } from 'next'
import { DM_Sans, DM_Mono, DM_Serif_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: '--font-dm-sans',
});
const dmMono = DM_Mono({
    subsets: ["latin"],
    weight: ['400', '500'],
    variable: '--font-dm-mono',
});
const dmSerif = DM_Serif_Display({
    subsets: ["latin"],
    weight: '400',
    style: ['normal', 'italic'],
    variable: '--font-dm-serif',
});

export const metadata: Metadata = {
    title: 'Casuist — Clinical Case Training',
    description: 'Practice real patient cases. Build diagnostic intuition. Get AI-grounded feedback with PubMed citations.',
    generator: 'v0.app',
    icons: {
        icon: [
            {
                url: '/icon-light-32x32.png',
                media: '(prefers-color-scheme: light)',
            },
            {
                url: '/icon-dark-32x32.png',
                media: '(prefers-color-scheme: dark)',
            },
            {
                url: '/icon.svg',
                type: 'image/svg+xml',
            },
        ],
        apple: '/apple-icon.png',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`${dmSans.variable} ${dmMono.variable} ${dmSerif.variable} font-sans antialiased`}>
                {children}
                <Analytics />
            </body>
        </html>
    )
}
