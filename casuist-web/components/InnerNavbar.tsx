'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const InnerNavbar = () => {
  const pathname = usePathname()
  const [hovered, setHovered] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // On mount: show expanded for 800ms, then collapse in place
  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), 800)
    return () => clearTimeout(timer)
  }, [])

  // Don't render on landing page
  if (pathname === '/') return null

  const expanded = hovered || !collapsed

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
        left: 'max(24px, calc(50% - 390px))',
        width: expanded ? 'min(65vw, 780px)' : '138px',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(46, 134, 193, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '100px',
        padding: '5px 6px 5px 20px',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(46, 134, 193, 0.35), 0 2px 8px rgba(46, 134, 193, 0.2)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <nav className="flex items-center justify-between whitespace-nowrap">
        {/* Left: Wordmark + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="text-sm font-medium tracking-tight text-white shrink-0"
          >
            Casuist
          </Link>
          <span
            className="text-white/60 text-sm select-none inline-block"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            ›
          </span>
        </div>

        {/* Right: Links + CTA — fade in with delay */}
        <div
          className="flex items-center gap-1"
          style={{
            opacity: expanded ? 1 : 0,
            transition: expanded ? 'opacity 0.2s ease 0.18s' : 'opacity 0.1s ease',
            pointerEvents: expanded ? 'auto' : 'none',
          }}
        >
          {navLinks.map((link) => {
            if (link.locked) {
              return (
                <span
                  key={link.name}
                  className="rounded-full px-4 py-1.5 text-sm font-medium cursor-default select-none inline-block"
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
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200"
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
            className="ml-1 rounded-full bg-white px-5 py-1.5 text-sm font-medium text-[#1A5276] transition-opacity duration-200 hover:opacity-90 shrink-0"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default InnerNavbar
