'use client'

import Navbar from '@/components/Navbar'

export default function SpecialtiesPage() {
  return (
    <div className="bg-background-light text-slate-900 min-h-screen">
      <div className="layout-container flex h-full grow flex-col">
        {/* Navigation */}
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-start py-12 px-6">
          <div className="max-w-4xl w-full">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight mb-3 font-display">Choose a Specialty</h1>
              <p className="text-slate-500 text-lg font-normal">Pick a domain to get a real clinical case</p>
            </div>
            {/* Specialties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cardiology */}
              <button className="flex flex-col items-center p-8 bg-white rounded-xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🫀</div>
                <h3 className="text-slate-900 text-xl font-bold mb-1 font-display">Cardiology</h3>
                <span className="text-slate-500 text-sm font-medium font-mono">124 cases</span>
              </button>
              {/* Respiratory */}
              <button className="flex flex-col items-center p-8 bg-white rounded-xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🫁</div>
                <h3 className="text-slate-900 text-xl font-bold mb-1 font-display">Respiratory</h3>
                <span className="text-slate-500 text-sm font-medium font-mono">98 cases</span>
              </button>
              {/* Neurology */}
              <button className="flex flex-col items-center p-8 bg-white rounded-xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
                <h3 className="text-slate-900 text-xl font-bold mb-1 font-display">Neurology</h3>
                <span className="text-slate-500 text-sm font-medium font-mono">72 cases</span>
              </button>
              {/* Gastroenterology */}
              <button className="flex flex-col items-center p-8 bg-white rounded-xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔬</div>
                <h3 className="text-slate-900 text-xl font-bold mb-1 font-display">Gastroenterology</h3>
                <span className="text-slate-500 text-sm font-medium font-mono">56 cases</span>
              </button>
              {/* Endocrinology */}
              <button className="flex flex-col items-center p-8 bg-white rounded-xl border-2 border-transparent hover:border-primary hover:shadow-xl transition-all group text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">⚗️</div>
                <h3 className="text-slate-900 text-xl font-bold mb-1 font-display">Endocrinology</h3>
                <span className="text-slate-500 text-sm font-medium font-mono">43 cases</span>
              </button>
              {/* More Options Placeholder */}
              <div className="flex flex-col items-center justify-center p-8 bg-slate-100/50 rounded-xl border-2 border-dashed border-slate-300 opacity-60">
                <span className="material-symbols-outlined text-4xl mb-2">add_circle</span>
                <p className="text-sm font-bold font-display uppercase tracking-wider">More coming soon</p>
              </div>
            </div>
            {/* Secondary Actions */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold shadow-sm">
                <span className="material-symbols-outlined text-lg">shuffle</span>
                Random Case
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-bold shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg">history</span>
                Resume Last Case
              </button>
            </div>
          </div>
        </main>
        <footer className="mt-auto py-8 border-t border-slate-200 text-center px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 opacity-60">
              <span className="material-symbols-outlined text-sm">medical_services</span>
              <span className="text-xs font-mono">CASUIST v2.4.0-BETA</span>
            </div>
            <div className="flex gap-6">
              <a className="text-xs font-medium text-slate-500 hover:text-primary" href="#">Library</a>
              <a className="text-xs font-medium text-slate-500 hover:text-primary" href="#">Settings</a>
              <a className="text-xs font-medium text-slate-500 hover:text-primary" href="#">Help Center</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
