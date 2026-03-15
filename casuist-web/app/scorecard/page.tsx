'use client'

import Navbar from '@/components/Navbar'

export default function ScorecardPage() {
  return (
    <div className="bg-background-light text-slate-900 min-h-screen">
      <div className="layout-container flex flex-col min-h-screen">
        {/* Navigation */}
        <Navbar />
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 max-w-5xl mx-auto w-full gap-y-16">
          {/* Main Score Section */}
          <div className="text-center">
            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mb-2">Case Performance</p>
            <h1 className="text-text-main text-7xl font-bold leading-tight font-display mb-4">74 <span className="text-slate-300">/</span> 100</h1>
            <div className="inline-flex items-center justify-center px-6 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-lg font-bold">
              Grade: B
            </div>
          </div>
          {/* Score Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {/* Diagnosis Accuracy */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Diagnosis Accuracy</p>
              <p className="text-2xl font-bold text-text-main font-mono">40/40</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            {/* Ranking Quality */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Ranking Quality</p>
              <p className="text-2xl font-bold text-text-main font-mono">18/30</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '60%' }}></div>
              </div>
            </div>
            {/* Info Efficiency */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Info Efficiency</p>
              <p className="text-2xl font-bold text-text-main font-mono">16/20</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '80%' }}></div>
              </div>
            </div>
            {/* Speed Bonus */}
            <div className="bg-white border border-border-gray p-6 rounded-xl shadow-sm">
              <p className="text-slate-500 text-sm font-medium mb-1">Speed Bonus</p>
              <p className="text-2xl font-bold text-text-main font-mono">0/10</p>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
          {/* AI Feedback Section */}
          <div className="w-full max-w-3xl">
            <button className="w-full flex items-center justify-between p-6 bg-white border border-border-gray rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">auto_awesome</span>
                <span className="font-semibold text-text-main">See AI Feedback + Citations</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">expand_more</span>
            </button>
          </div>
          {/* Actions */}
          <div className="flex flex-col items-center gap-8 w-full">
            <button className="bg-primary hover:bg-primary/90 text-white font-bold py-5 px-16 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 text-xl">
              Next Case
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <a className="text-slate-500 hover:text-primary font-medium transition-colors text-sm border-b border-transparent hover:border-primary" href="#">
              Back to Specialties
            </a>
          </div>
        </main>
        <footer className="py-10 text-center text-slate-400 text-xs font-mono uppercase tracking-tighter shrink-0">
          CASUIST CLINICAL ENGINE v4.2.0 • FOR EDUCATIONAL PURPOSES ONLY
        </footer>
      </div>
    </div>
  )
}
