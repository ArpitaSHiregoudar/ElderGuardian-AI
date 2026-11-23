import React from 'react';
import { PhoneCall, ShieldCheck, HeartHandshake, AlertOctagon, CheckCircle2, Clock, Calendar, Pill, TrendingUp, Sparkles, User, BellRing } from 'lucide-react';

export default function FamilyView({ data, onApproveRefill, onCallParent }) {
  const { patient, medications, familyCaregiver, refillRequests, appointments } = data;

  const takenCount = medications.filter((m) => m.status === 'TAKEN').length;
  const adherencePercent = Math.round((takenCount / medications.length) * 100);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Caregiver Remote Guardian Header */}
      <section className="bg-gradient-to-r from-brand-teal-dark to-brand-teal text-white rounded-3xl p-6 md:p-8 shadow-elder-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>DPDP Consent Active • Primary Legal Health Proxy</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Guardian Dashboard: {familyCaregiver.name}
            </h2>
            <p className="text-slate-100 text-sm md:text-base mt-1">
              Monitoring father <strong>{patient.name} (72 yrs)</strong> in {familyCaregiver.parentLocation} from {familyCaregiver.location}.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onCallParent}
              className="bg-white text-brand-teal-dark hover:bg-slate-100 active:scale-95 font-extrabold px-5 py-3.5 rounded-2xl shadow-md flex items-center space-x-2 text-sm transition"
            >
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              <span>Call Papa Directly</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real-time Health & Adherence KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-elder">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Pill Adherence</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{adherencePercent}%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              {takenCount}/{medications.length} Doses
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${adherencePercent}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-elder">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Morning Blood Pressure</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{patient.vitals.bloodPressure}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
            Within Target Range (< 130/85)
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-elder">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Refill Horizon</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-red-600">4 Days</span>
          </div>
          <p className="text-xs text-red-600 font-semibold mt-3">
            Telmisartan 40mg stock critical
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-elder">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Scheduled Visit</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-brand-navy">Tomorrow</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 truncate">
            Dr. Suresh Sharma (Apollo OPD)
          </p>
        </div>
      </section>

      {/* CAREGIVER APPROVALS & ALERTS */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-elder space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Caregiver Action Required: Medicine Refill</h3>
              <p className="text-sm text-slate-500">Pre-approved prescription verified against Apollo EMR record.</p>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
            Pending Proxy Signoff
          </span>
        </div>

        {refillRequests.map((req) => (
          <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-extrabold text-slate-900">{req.medicationName}</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Pharmacy: <strong>{req.pharmacy}</strong> • Prescription: <span className="text-emerald-700 font-bold">{req.prescriptionValidUntil}</span>
              </p>
              <p className="text-xs text-red-600 font-semibold mt-1">
                Estimated Depletion: {req.depletionDate}
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <span className="text-xl font-black text-slate-900">{req.price}</span>
              <button
                onClick={() => onApproveRefill(req.id)}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl text-sm transition shadow-sm active:scale-95"
              >
                Approve & Dispatch Order
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* DETAILED DAILY REGIMEN TRACKER */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-elder">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center space-x-2">
          <Pill className="w-5 h-5 text-brand-teal" />
          <span>Longitudinal Medication Compliance (Live Feed)</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {medications.map((med) => (
            <div key={med.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-extrabold text-slate-900 text-base">{med.name}</p>
                <p className="text-xs text-slate-500">{med.timing} • {med.dosage}</p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500 font-medium">
                  {med.remainingPills} pills in bottle
                </span>
                {med.status === 'TAKEN' ? (
                  <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Logged by Ramesh (8:14 AM)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Scheduled ({med.timing.split(' ')[0]})</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
