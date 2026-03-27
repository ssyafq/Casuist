'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const InnerNavbar = () => {
  const pathname = usePathname()

  // Don't render on landing page
  if (pathname === '/') return null

  const navLinks = [
    { name: 'Cases', href: '/specialties', locked: false },
    { name: 'Leaderboard', href: '#', locked: true },
    { name: 'How It Works', href: '/#how-it-works', locked: false },
  ]

  return (
    <header
      className="fixed z-50"
      style={{
        top: '24px',
        left: 'calc(50% - min(32.5vw, 430px))',
        width: 'min(65vw, 860px)',
        background: 'rgba(46, 134, 193, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '100px',
        padding: '6px 8px 6px 24px',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(46, 134, 193, 0.35), 0 2px 8px rgba(46, 134, 193, 0.2)',
        overflow: 'hidden',
      }}
    >
      <nav className="flex items-center justify-between whitespace-nowrap">
        {/* Left: Wordmark + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="text-base font-medium tracking-tight text-white shrink-0"
          >
            Casuist
          </Link>
          <span
            className="text-white/60 text-base select-none inline-block"
            style={{ transform: 'rotate(180deg)' }}
          >
            ›
          </span>
        </div>

        {/* Right: Links + CTA */}
        <div className="flex items-center gap-1.5">
          {navLinks.map((link) => {
            if (link.locked) {
              return (
                <span
                  key={link.name}
                  className="rounded-full px-5 py-2 text-sm font-medium cursor-default select-none inline-block"
                  style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  {link.name} {'\uD83D\uDD12'}
                </span>
              )
            }

            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200"
                style={
                  isActive
                    ? { color: '#fff', background: 'rgba(255, 255, 255, 0.18)' }
                    : { color: 'rgba(255, 255, 255, 0.65)' }
                }
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'
                }}
              >
                {link.name}
              </Link>
            )
          })}

          {/* CTA button */}
          <Link
            href="/specialties"
            className="ml-1.5 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#1A5276] transition-opacity duration-200 hover:opacity-90 shrink-0"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default InnerNavbar
