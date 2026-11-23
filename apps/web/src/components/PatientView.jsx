import React from 'react';
import { CheckCircle2, Clock, Calendar, AlertTriangle, Pill, HeartPulse, RefreshCw, Sparkles, MapPin, ChevronRight, Phone } from 'lucide-react';

export default function PatientView({ data, onTakeDose, onSkipDose, onBookApt, onRefillClick }) {
  const { patient, medications, appointments, refillRequests } = data;

  const pendingCount = medications.filter((m) => m.status === 'PENDING').length;
  const takenCount = medications.filter((m) => m.status === 'TAKEN').length;
  const nextAppointment = appointments[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Senior Greeting Banner */}
      <section className="bg-gradient-to-r from-brand-navy to-brand-navy-dark text-white rounded-3xl p-6 md:p-8 shadow-elder-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-brand-teal/30 text-brand-teal-light px-3 py-1 rounded-full text-sm font-bold mb-3 border border-brand-teal/40">
            <HeartPulse className="w-4 h-4" />
            <span>Care Journey Active • Monitored by Apollo Chennai</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Namaste, {patient.name} ji
          </h2>
          <p className="mt-2 text-slate-200 text-base md:text-lg leading-relaxed">
            You have <strong className="text-white underline decoration-brand-teal decoration-4">{pendingCount} medications</strong> scheduled for today. Your daughter Priya and Dr. Suresh Sharma are keeping watch.
          </p>

          {/* Quick Adherence Status Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <div>
              <p className="text-xs text-slate-300 font-medium">Morning Dose</p>
              <p className="text-lg font-extrabold text-brand-teal-light">
                {medications.find(m => m.id === 'med-2')?.status === 'TAKEN' ? '✓ Completed' : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Blood Pressure</p>
              <p className="text-lg font-extrabold text-white">{patient.vitals.bloodPressure}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Fasting Sugar</p>
              <p className="text-lg font-extrabold text-white">{patient.vitals.bloodGlucoseFasting}</p>
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Care Guardian</p>
              <p className="text-lg font-extrabold text-emerald-300">Active (Priya)</p>
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S MEDICATIONS — Core Elderly Accessibility Feature */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-brand-navy flex items-center space-x-2">
              <Pill className="w-7 h-7 text-brand-teal" />
              <span>Today's Medicine Schedule</span>
            </h3>
            <p className="text-slate-600 text-sm">Large buttons designed for easy tapping. Click "TAKEN" after swallowing.</p>
          </div>
          <span className="text-sm font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
            {takenCount} of {medications.length} Taken
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med) => {
            const isTaken = med.status === 'TAKEN';
            const isSkipped = med.status === 'SKIPPED';

            return (
              <div
                key={med.id}
                className={`p-6 rounded-3xl border-2 transition-all shadow-elder ${
                  isTaken
                    ? 'bg-emerald-50/70 border-emerald-400'
                    : isSkipped
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-white border-slate-200 hover:border-brand-teal'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wide bg-slate-100 text-slate-700">
                        {med.timeCategory}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{med.timing}</span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-black text-slate-900 mt-2">
                      {med.name}
                    </h4>
                    <p className="text-sm font-medium text-slate-600">{med.generic}</p>
                    <p className="text-xs font-semibold text-brand-navy mt-1 bg-brand-navy-light/60 inline-block px-2 py-0.5 rounded">
                      Purpose: {med.purpose}
                    </p>
                  </div>

                  {/* Stock Alert Badge */}
                  {med.remainingPills <= 5 && (
                    <div className="text-right">
                      <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2.5 py-1 rounded-full border border-red-300 inline-flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{med.remainingPills} left</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicator & Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  {isTaken ? (
                    <div className="w-full flex items-center justify-between bg-emerald-100 text-emerald-800 px-4 py-3 rounded-2xl font-bold">
                      <span className="flex items-center space-x-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span className="text-base">Dose Confirmed (Logged)</span>
                      </span>
                      <button
                        onClick={() => onSkipDose(med.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onTakeDose(med.id)}
                        className="w-full sm:flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg rounded-2xl shadow-md flex items-center justify-center space-x-2 transition"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        <span>TAKE DOSE</span>
                      </button>
                      <button
                        onClick={() => onSkipDose(med.id)}
                        className="w-full sm:w-auto px-5 h-14 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition"
                      >
                        Skip Today
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* UPCOMING CLINIC VISIT & REFILL COORDINATION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Appointment Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-elder flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-navy bg-brand-navy-light px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>Next Hospital Visit</span>
              </span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md">
                Confirmed
              </span>
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">{nextAppointment.doctorName}</h4>
            <p className="text-sm font-semibold text-brand-teal">{nextAppointment.specialty}</p>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {nextAppointment.hospital} • {nextAppointment.room}
            </p>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-xs text-slate-500 font-semibold">Date & Slot:</p>
              <p className="text-lg font-black text-slate-800">{nextAppointment.date} at {nextAppointment.time}</p>
              <p className="text-xs text-slate-600 mt-1"><strong>Agenda:</strong> {nextAppointment.purpose}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onBookApt}
              className="w-full bg-brand-navy hover:bg-brand-navy-dark text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition shadow-sm flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book / Reschedule Appointment</span>
            </button>
          </div>
        </div>

        {/* Intelligent Refill Coordination Banner */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-300 shadow-elder flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-3 py-1 rounded-full">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Care Journey: Refill Alert</span>
              </span>
              <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                4 Days Left
              </span>
            </div>
            <h4 className="text-xl font-black text-amber-950">
              Telmisartan 40mg Depletion Detected
            </h4>
            <p className="text-sm text-amber-900/80 mt-1 leading-relaxed">
              Based on your daily morning schedule, your current strip of blood pressure medicine will finish by <strong>Nov 28, 2026</strong>.
            </p>

            <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-amber-200">
              <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                <span>Prescription Check:</span>
                <span className="font-bold text-emerald-700">✓ Valid until Jan 2027</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                <span>Partner Pharmacy:</span>
                <span className="font-bold text-slate-800">Apollo Cathedral Rd</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Estimated Total:</span>
                <span className="font-black text-slate-900 text-sm">₹148.00 (Doorstep Delivery)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200">
            <button
              onClick={onRefillClick}
              className="w-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold py-3.5 px-4 rounded-2xl text-base transition shadow-md flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>CONFIRM 1-TAP REFILL REQUEST</span>
            </button>
            <p className="text-center text-xs text-amber-800/80 mt-2">
              Priya (Caregiver) will be automatically updated via SMS & In-App notification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
