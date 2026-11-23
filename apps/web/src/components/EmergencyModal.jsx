import React from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, X, HeartPulse } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, patient }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border-4 border-red-600 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2 text-red-700">
            <ShieldAlert className="w-8 h-8 text-red-600 animate-bounce" />
            <div>
              <h3 className="text-2xl font-black text-red-700">EMERGENCY PROTOCOL</h3>
              <p className="text-xs text-slate-500">ElderGuardian Immediate Escalation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
            <p className="text-xs font-bold text-red-800 uppercase">Patient in Distress</p>
            <h4 className="text-xl font-black text-slate-900 mt-1">{patient.name} (Age: {patient.age})</h4>
            <p className="text-xs text-slate-600 mt-1">
              Known Conditions: {patient.conditions.join(', ')}
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="tel:108"
              className="w-full h-16 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg flex items-center justify-center space-x-3 shadow-lg active:scale-95 transition"
            >
              <PhoneCall className="w-6 h-6" />
              <span>CALL 108 NATIONAL AMBULANCE</span>
            </a>

            <a
              href={`tel:${patient.emergencyContact.phone}`}
              className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-extrabold text-base flex items-center justify-center space-x-3 shadow-md active:scale-95 transition"
            >
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              <span>CALL CAREGIVER: {patient.emergencyContact.name}</span>
            </a>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 text-center">
            GPS Location Coordinates broadcast to Apollo Emergency Triage Unit (Chennai).
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
            >
              Dismiss Alarm (False Alarm / Resolved)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
