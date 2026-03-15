'use client'

import Navbar from '@/components/Navbar'

export default function CasePage() {
  return (
    <div className="bg-background-light text-text min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <section className="lg:w-[60%] border-r border-border bg-white overflow-y-auto p-8">
          <div className="flex items-center space-x-3 mb-8 font-mono text-sm text-gray-500">
            <span className="font-medium text-text">Case #0042</span>
            <span>·</span>
            <span>Cardiology</span>
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
            <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
              <div className="text-center">
                <span className="material-icons text-gray-400 mb-2 text-3xl">lock</span>
                <h3 className="font-medium text-gray-600">Physical Exam details are locked</h3>
                <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-dashed border-gray-300 opacity-60 flex items-center justify-center min-h-[120px]">
              <div className="text-center">
                <span className="material-icons text-gray-400 mb-2 text-3xl">lock</span>
                <h3 className="font-medium text-gray-600">Laboratory Results are locked</h3>
                <p className="text-sm text-gray-500 mt-1">Request this information from the action panel.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="lg:w-[40%] bg-background-light overflow-y-auto flex flex-col p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-navy mb-2">What would you like to know?</h2>
            <p className="text-sm text-gray-600">Gather information strategically to formulate your diagnosis. Each request may cost clinical points.</p>
          </div>
          <div className="flex-grow space-y-4">
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
            <button className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-icons">accessibility_new</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900">Request Physical Exam</span>
                  <span className="text-xs text-gray-500">Vitals, cardiovascular, pulmonary...</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-2 pts</span>
            </button>
            <button className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-icons">science</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900">Request Lab Results</span>
                  <span className="text-xs text-gray-500">ECG, Troponin, CBC, BMP...</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-3 pts</span>
            </button>
            <button className="w-full text-left bg-white border border-border hover:border-primary hover:shadow-sm transition-all rounded-lg p-4 flex items-center justify-between group">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-icons">medical_services</span>
                </div>
                <div>
                  <span className="block font-medium text-gray-900">Request Imaging</span>
                  <span className="text-xs text-gray-500">CXR, Echocardiogram...</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary transition-colors">-4 pts</span>
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-gray-500">Current Score Potential</span>
              <span className="font-mono font-bold text-green-600">95/100</span>
            </div>
            <button className="w-full bg-primary hover:bg-navy text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center">
              Ready to Diagnose
              <span className="material-icons ml-2">arrow_forward</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
