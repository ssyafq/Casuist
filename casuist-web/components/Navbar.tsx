'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navbar = () => {
  const pathname = usePathname()
  const [leaderboardHover, setLeaderboardHover] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y <= 10) {
        setHidden(false)
      } else if (y > lastScrollY.current) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastScrollY.current = y
    }

    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 80) {
        setHidden(false)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  // Only render on landing page
  if (pathname !== '/') return null

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
        left: '50%',
        transform: hidden ? 'translateX(-50%) translateY(-120%)' : 'translateX(-50%) translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '65vw',
        maxWidth: '860px',
        minWidth: '520px',
        background: 'rgba(46, 134, 193, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '100px',
        padding: '6px 8px 6px 24px',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(46, 134, 193, 0.35), 0 2px 8px rgba(46, 134, 193, 0.2)',
      }}
    >
      <nav className="flex items-center justify-between">
        {/* Wordmark — far left */}
        <Link
          href="/"
          className="text-base font-medium tracking-tight text-white shrink-0"
        >
          Casuist
        </Link>

        {/* Links + CTA — right side */}
        <div className="flex items-center gap-1.5">
          {navLinks.map((link) => {
            if (link.locked) {
              return (
                <div key={link.name} className="relative">
                  <span
                    className="rounded-full px-5 py-2 text-sm font-medium cursor-default select-none inline-block"
                    style={{ color: 'rgba(255, 255, 255, 0.35)' }}
                    onMouseEnter={() => setLeaderboardHover(true)}
                    onMouseLeave={() => setLeaderboardHover(false)}
                  >
                    {link.name}{leaderboardHover && ' \uD83D\uDD12'}
                  </span>
                  {leaderboardHover && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-white pointer-events-none"
                      style={{ background: 'rgba(0, 0, 0, 0.75)' }}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
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

export default Navbar
