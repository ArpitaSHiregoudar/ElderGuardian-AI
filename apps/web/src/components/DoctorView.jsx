import React, { useState } from 'react';
import { Stethoscope, User, Calendar, FileText, PlusCircle, CheckCircle2, AlertTriangle, Search, Activity, Sparkles } from 'lucide-react';

export default function DoctorView({ data, onAddPrescription }) {
  const { doctor, patient, medications, appointments } = data;
  const [showRxModal, setShowRxModal] = useState(false);
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet Daily');
  const [instructions, setInstructions] = useState('After meals');

  const handleCreateRx = (e) => {
    e.preventDefault();
    if (!drugName) return;
    onAddPrescription({
      name: drugName,
      dosage,
      instructions,
    });
    setDrugName('');
    setShowRxModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Doctor Clinic Header */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-elder-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-brand-teal rounded-2xl flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-9 h-9" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 bg-slate-800 text-slate-300 px-3 py-0.5 rounded-full text-xs font-bold mb-1">
                <span>Registration: {doctor.registrationNumber}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {doctor.name}
              </h2>
              <p className="text-slate-400 text-sm">
                {doctor.specialization} • {doctor.hospital} ({doctor.experience} exp)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRxModal(true)}
            className="bg-brand-teal hover:bg-brand-teal-dark active:scale-95 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-md flex items-center space-x-2 text-sm transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Write Digital Rx</span>
          </button>
        </div>
      </section>

      {/* TODAY'S OPD PATIENT QUEUE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Case File */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-elder space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-brand-navy text-lg">
                RK
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                  <span>{patient.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                    Age: {patient.age} • Blood: {patient.bloodGroup}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">ABHA: {patient.abhaId}</p>
              </div>
            </div>
            <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              OPD Queue: #03 (10:30 AM)
            </span>
          </div>

          {/* Clinical Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Diagnosed Conditions</p>
              <ul className="text-xs font-semibold text-slate-800 mt-2 space-y-1">
                {patient.conditions.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Documented Allergies</p>
              <p className="text-xs font-bold text-red-600 mt-2">{patient.allergies[0]}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">Latest Vitals</p>
              <p className="text-xs font-semibold text-slate-700 mt-2">
                BP: <strong>{patient.vitals.bloodPressure}</strong><br />
                Fasting: <strong>{patient.vitals.bloodGlucoseFasting}</strong><br />
                Pulse: <strong>{patient.vitals.heartRate}</strong>
              </p>
            </div>
          </div>

          {/* Active Medication Regimen */}
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              Current Active Regimen & Compliance Rate (88%)
            </h4>
            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
              {medications.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-extrabold text-slate-900">{m.name}</span>
                    <span className="text-xs text-slate-500 ml-2">({m.dosage})</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {m.timing}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Care Journey Intelligence */}
        <div className="bg-gradient-to-br from-brand-navy-light/60 to-white rounded-3xl p-6 border-2 border-brand-teal/40 shadow-elder flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-brand-navy font-extrabold text-sm mb-3">
              <Sparkles className="w-5 h-5 text-brand-teal" />
              <span>Care Journey AI Clinical Decision Support</span>
            </div>
            <h4 className="text-lg font-black text-brand-navy leading-snug">
              Upcoming Telemetry Flags & Refill Notice
            </h4>
            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <p className="font-bold text-amber-800 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mr-1" />
                  <span>Depletion Forecast: Telmisartan 40mg</span>
                </p>
                <p className="text-slate-600 mt-1">
                  Patient stock finishes in 4 days. Pharmacy pre-order ready upon your authorization.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <p className="font-bold text-brand-navy">HbA1c Lab Follow-up Due</p>
                <p className="text-slate-600 mt-1">
                  Last Glycated Hemoglobin check was 88 days ago (7.2%). Scheduled for next quarterly panel.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center font-medium">
              Decision Support Only • Doctor maintains exclusive prescribing authority.
            </p>
          </div>
        </div>
      </section>

      {/* MODAL: Write Digital Prescription */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Issue Doctor-Authorized Prescription
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {patient.name} (72 yrs) • Linked to Apollo Pharmacy Network
            </p>

            <form onSubmit={handleCreateRx} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Medicine Name & Strength
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amlodipine 5mg"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dosage Schedule
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instructions
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                Notice: Saving this prescription automatically generates medication reminder cards in Ramesh's mobile dashboard and notifies caregiver Priya.
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-navy hover:bg-brand-navy-dark text-white font-extrabold rounded-xl text-sm shadow-md"
                >
                  Authorize & Sign Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
