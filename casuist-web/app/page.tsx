'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-background-light text-text-main min-h-screen">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          {/* Navigation */}
          <Navbar />
          {/* Hero Section */}
          <main className="flex-1 flex items-center justify-center py-20 md:py-40 px-8 md:px-24">
            <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              {/* Left Column: Content */}
              <div className="flex flex-col gap-12 order-2 lg:order-1">
                <div className="flex flex-col gap-6">
                  <span className="text-primary text-sm font-bold tracking-[0.2em] uppercase">CLINICAL CASE LEARNING</span>
                  <h1 className="text-text-main text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
                    Practice medicine<br /><span className="text-primary">before you practice</span><br />medicine.
                  </h1>
                  <p className="text-slate-600 text-xl md:text-2xl font-normal leading-relaxed max-w-[600px]">
                    Work through real PubMed case reports. Build your differential diagnosis skills with interactive patient simulations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-6">
                  <Link href="/specialties" className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-16 px-10 bg-primary hover:bg-primary-dark text-white text-lg font-bold transition-all shadow-xl shadow-primary/25">
                    Try a Case
                  </Link>
                  <Link href="/specialties" className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-xl h-16 px-10 border-2 border-neutral-gray hover:border-primary text-text-main text-lg font-bold transition-all">
                    See How It Works
                  </Link>
                </div>
                <div className="flex flex-col gap-2 pt-10 border-t border-neutral-gray">
                  <div className="flex items-center gap-3 text-slate-500 text-base font-medium">
                    <span className="material-symbols-outlined text-primary text-xl">verified</span>
                    <span>607 real cases · 5 specialties · AI-grounded feedback</span>
                  </div>
                </div>
              </div>
              {/* Right Column: Browser Mockup */}
              <div className="order-1 lg:order-2 relative group">
                {/* Decorative Blobs */}
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-primary/10 rounded-full blur-[80px] -z-10"></div>
                <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px] -z-10"></div>
                {/* Mockup Container */}
                <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.12)] border border-neutral-gray overflow-hidden transform group-hover:scale-[1.03] transition-transform duration-700">
                  {/* Browser Header */}
                  <div className="h-12 bg-slate-50 border-b border-neutral-gray flex items-center px-6 gap-3">
                    <div className="flex gap-2">
                      <div className="size-3 rounded-full bg-red-400"></div>
                      <div className="size-3 rounded-full bg-amber-400"></div>
                      <div className="size-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="mx-auto bg-white rounded-md px-4 py-1 text-[11px] text-slate-400 flex items-center gap-2 min-w-[240px] justify-center">
                      <span className="material-symbols-outlined text-[11px]">lock</span>
                      casuist.med/case/782-acute-chest-pain
                    </div>
                  </div>
                  {/* Mockup Content */}
                  <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                      <div className="space-y-2">
                        <div className="h-2.5 w-28 bg-primary/20 rounded"></div>
                        <div className="h-5 w-56 bg-slate-200 rounded"></div>
                      </div>
                      <div className="h-10 w-24 bg-slate-100 rounded-xl flex items-center justify-center">
                        <div className="h-2.5 w-14 bg-slate-300 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 mb-4">
                      <div className="col-span-2 space-y-6">
                        <div className="space-y-3">
                          <div className="h-3.5 w-full bg-slate-100 rounded"></div>
                          <div className="h-3.5 w-[90%] bg-slate-100 rounded"></div>
                          <div className="h-3.5 w-[95%] bg-slate-100 rounded"></div>
                        </div>
                        {/* Case Image Placeholder */}
                        <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-neutral-gray/50 flex items-center justify-center relative">
                          <div className="bg-slate-200 rounded-lg w-full h-full" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="h-40 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4 space-y-3">
                          <div className="h-2.5 w-20 bg-primary/30 rounded"></div>
                          <div className="h-2.5 w-full bg-slate-200 rounded"></div>
                          <div className="h-2.5 w-full bg-slate-200 rounded"></div>
                          <div className="h-2.5 w-2/3 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-32 bg-primary/5 rounded-2xl border border-primary/20 p-5 flex flex-col justify-end gap-3">
                          <div className="h-2.5 w-full bg-primary/20 rounded"></div>
                          <div className="h-10 w-full bg-primary rounded-xl"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
