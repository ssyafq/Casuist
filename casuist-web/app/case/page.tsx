'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const sectionData: Record<string, { title: string; content: React.ReactNode }> = {
  physical: {
    title: 'Physical Exam',
    content: (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold text-gray-900 block mb-1">Vitals</span>
          <ul className="list-disc pl-4 text-gray-600 space-y-1">
            <li>BP: 158/94 mmHg</li>
            <li>HR: 102 bpm, irregular</li>
            <li>RR: 22/min</li>
            <li>SpO2: 94% on room air</li>
            <li>Temp: 37.1°C</li>
          </ul>
        </div>
        <div>
          <span className="font-semibold text-gray-900 block mb-1">Cardiovascular</span>
          <ul className="list-disc pl-4 text-gray-600 space-y-1">
            <li>S1/S2 present, S4 gallop noted</li>
            <li>No murmurs or rubs</li>
            <li>JVP elevated at 8cm</li>
            <li>Bilateral pedal edema (1+)</li>
          </ul>
        </div>
      </div>
    ),
  },
  labs: {
    title: 'Laboratory Results',
    content: (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold text-gray-900 block mb-1">Cardiac Markers</span>
          <ul className="list-disc pl-4 text-gray-600 space-y-1">
            <li>Troponin I: 2.4 ng/mL (elevated)</li>
            <li>CK-MB: 38 U/L (elevated)</li>
            <li>BNP: 580 pg/mL (elevated)</li>
          </ul>
        </div>
        <div>
          <span className="font-semibold text-gray-900 block mb-1">Basic Metabolic</span>
          <ul className="list-disc pl-4 text-gray-600 space-y-1">
            <li>Na: 139 mEq/L</li>
            <li>K: 4.2 mEq/L</li>
            <li>Cr: 1.1 mg/dL</li>
            <li>Glucose: 186 mg/dL</li>
          </ul>
        </div>
      </div>
    ),
  },
  imaging: {
    title: 'Imaging',
    content: (
      <div className="text-sm">
        <div>
          <span className="font-semibold text-gray-900 block mb-1">ECG</span>
          <p className="text-gray-600 mb-3">ST-segment elevation in leads II, III, aVF. Reciprocal ST depression in leads I, aVL. Normal sinus rhythm with occasional PVCs.</p>
          <span className="font-semibold text-gray-900 block mb-1">Chest X-Ray</span>
          <p className="text-gray-600">Mild cardiomegaly. No pulmonary edema or pleural effusions. Clear lung fields bilaterally.</p>
        </div>
      </div>
    ),
  },
}

function CasePageContent() {
  const searchParams = useSearchParams()
  const specialty = searchParams.get('specialty') || 'cardiology'
  const specialtyLabel = specialty.charAt(0).toUpperCase() + specialty.slice(1)

  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set())

  const toggleSection = (key: string) => {
    setRevealedSections((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }

  const pointsUsed = Array.from(revealedSections).reduce((sum, key) => {
    if (key === 'physical') return sum + 2
    if (key === 'labs') return sum + 3
    if (key === 'imaging') return sum + 4
    return sum
  }, 0)

  return (
    <div className="bg-background-light text-text min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <section className="lg:w-[60%] border-r border-border bg-white overflow-y-auto p-8">
          <div className="flex items-center space-x-3 mb-8 font-mono text-sm text-gray-500">
            <span className="font-medium text-text">Case #0042</span>
            <span>·</span>
            <span>{specialtyLabel}</span>
            <span>·</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Medium
            </span>
          </div>
          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Chief Complaint</h2>
            <p className="text-2xl font-bold leading-tight text-text">&quot;I&apos;ve been having this crushing pain in my chest that radiates to my left arm.&quot;</p>
          </div>
          <div className="flex space-x-8 mb-10 pb-8 border-b border-border">
            <div>
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Age</span>
              <span className="font-medium">58 years</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Gender</span>
              <span className="font-medium">Male</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Setting</span>
              <span className="font-medium">Emergency Department</span>
            </div>
          </div>
          <div className="space-y-6">
            {/* History - always revealed */}
            <div className="bg-gray-50 rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <span className="material-icons text-primary mr-2">history</span>
                  History of Present Illness
                </h3>
                <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Patient presents to the ED with severe substernal chest pain that began 45 minutes ago while mowing the lawn. He describes it as an &quot;elephant sitting on my chest,&quot; rating it 9/10 in severity. The pain radiates to his left jaw and left arm. Associated symptoms include diaphoresis, shortness of breath, and nausea. He took one sublingual nitroglycerin 15 minutes ago with minimal relief.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4 mt-4">
                <div>
                  <span className="font-semibold text-gray-900 block mb-1">Past Medical History</span>
                  <ul className="list-disc pl-4 text-gray-600 space-y-1">
                    <li>Hypertension</li>
                    <li>Hyperlipidemia</li>
                    <li>Type 2 Diabetes Mellitus</li>
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block mb-1">Social History</span>
                  <ul className="list-disc pl-4 text-gray-600 space-y-1">
                    <li>Former smoker (quit 5 yrs ago)</li>
                    <li>Occasional alcohol use</li>
                    <li>Sedentary lifestyle</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Physical Exam - toggleable */}
            {revealedSections.has('physical') ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="material-icons text-primary mr-2">accessibility_new</span>
                    Physical Exam
                  </h3>
                  <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
                </div>
                {sectionData.physical.content}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <span className="material-icons text-gray-400 mb-2 text-3xl">lock</span>
                  <h3 className="font-medium text-gray-600">Physical Exam details are locked</h3>
                  <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}

            {/* Lab Results - toggleable */}
            {revealedSections.has('labs') ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="material-icons text-primary mr-2">science</span>
                    Laboratory Results
                  </h3>
                  <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
                </div>
                {sectionData.labs.content}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <span className="material-icons text-gray-400 mb-2 text-3xl">lock</span>
                  <h3 className="font-medium text-gray-600">Laboratory Results are locked</h3>
                  <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}

            {/* Imaging - toggleable */}
            {revealedSections.has('imaging') ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <span className="material-icons text-primary mr-2">medical_services</span>
                    Imaging
                  </h3>
                  <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-1 rounded">Revealed</span>
                </div>
                {sectionData.imaging.content}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                  <span className="material-icons text-gray-400 mb-2 text-3xl">lock</span>
                  <h3 className="font-medium text-gray-600">Imaging results are locked</h3>
                  <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Action Panel */}
        <section className="lg:w-[40%] bg-background-light overflow-y-auto flex flex-col p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-navy mb-2">What would you like to know?</h2>
            <p className="text-sm text-gray-600">Gather information strategically to formulate your diagnosis. Each request may cost clinical points.</p>
          </div>
          <div className="flex-grow space-y-4">
            {/* History - always done */}
            <button className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-disabled:text-gray-400">
                  <span className="material-icons">history</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request History</span>
                  <span className="text-xs text-gray-500">Already requested</span>
                </div>
              </div>
              <span className="material-icons text-green-500">check_circle</span>
            </button>

            {/* Physical Exam */}
            <button
              onClick={() => toggleSection('physical')}
              disabled={revealedSections.has('physical')}
              className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white group-disabled:bg-gray-100 group-disabled:text-gray-400 transition-colors">
                  <span className="material-icons">accessibility_new</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request Physical Exam</span>
                  <span className="text-xs text-gray-500">{revealedSections.has('physical') ? 'Already requested' : 'Vitals, cardiovascular, pulmonary...'}</span>
                </div>
              </div>
              {revealedSections.has('physical') ? (
                <span className="material-icons text-green-500">check_circle</span>
              ) : (
                <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-2 pts</span>
              )}
            </button>

            {/* Lab Results */}
            <button
              onClick={() => toggleSection('labs')}
              disabled={revealedSections.has('labs')}
              className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white group-disabled:bg-gray-100 group-disabled:text-gray-400 transition-colors">
                  <span className="material-icons">science</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request Lab Results</span>
                  <span className="text-xs text-gray-500">{revealedSections.has('labs') ? 'Already requested' : 'ECG, Troponin, CBC, BMP...'}</span>
                </div>
              </div>
              {revealedSections.has('labs') ? (
                <span className="material-icons text-green-500">check_circle</span>
              ) : (
                <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-3 pts</span>
              )}
            </button>

            {/* Imaging */}
            <button
              onClick={() => toggleSection('imaging')}
              disabled={revealedSections.has('imaging')}
              className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white group-disabled:bg-gray-100 group-disabled:text-gray-400 transition-colors">
                  <span className="material-icons">medical_services</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900 group-disabled:text-gray-500">Request Imaging</span>
                  <span className="text-xs text-gray-500">{revealedSections.has('imaging') ? 'Already requested' : 'CXR, Echocardiogram...'}</span>
                </div>
              </div>
              {revealedSections.has('imaging') ? (
                <span className="material-icons text-green-500">check_circle</span>
              ) : (
                <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-4 pts</span>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-gray-500">Current Score Potential</span>
              <span className="font-mono font-bold text-green-600">{100 - pointsUsed}/100</span>
            </div>
            <Link
              href={`/scorecard?specialty=${specialty}`}
              className="w-full bg-primary hover:bg-navy text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            >
              Ready to Diagnose
              <span className="material-icons ml-2">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function CasePage() {
  return (
    <Suspense>
      <CasePageContent />
    </Suspense>
  )
}
