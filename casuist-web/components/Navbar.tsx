'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Stethoscope } from 'lucide-react'

const Navbar = () => {
  const pathname = usePathname()

  const navLinks = [
    { name: 'Cases', href: '/specialties' },
    { name: 'How It Works', href: '/#how-it-works' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12 h-16">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2E86C1]/10 transition-colors duration-200 group-hover:bg-[#2E86C1]/20">
            <Stethoscope className="h-5 w-5 text-[#2E86C1]" />
          </div>
          <span className="text-xl font-medium tracking-tight text-foreground">
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
                className={`text-sm font-medium transition-colors duration-200 hover:text-[#2E86C1] relative py-1 ${
                  isActive ? 'text-[#2E86C1]' : 'text-muted-foreground'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#2E86C1]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Empty for now */}
        <div className="w-9 md:w-[100px]"></div>
      </div>
    </header>
  )
}

export default Navbar
