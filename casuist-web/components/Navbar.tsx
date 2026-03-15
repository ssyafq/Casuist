'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Stethoscope } from 'lucide-react'

const Navbar = () => {
  const pathname = usePathname()

  const navLinks = [
    { name: 'Cases', href: '/case' },
    { name: 'Specialties', href: '/specialties' },
    { name: 'How It Works', href: '/#how-it-works' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-4 px-8 md:px-24">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-navy">
            Casuist
          </span>
        </Link>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary relative py-1 ${
                  isActive ? 'text-primary' : 'text-slate-600'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Empty for now */}
        <div className="w-10 md:w-[100px]"></div>
      </div>
    </header>
  )
}

export default Navbar
