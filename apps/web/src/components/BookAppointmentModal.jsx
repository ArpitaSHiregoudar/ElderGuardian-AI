import React, { useState } from 'react';
import { Calendar, Clock, Stethoscope, MapPin, X, CheckCircle } from 'lucide-react';

export default function BookAppointmentModal({ isOpen, onClose, onBookSuccess }) {
  if (!isOpen) return null;

  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Suresh Sharma, MD');
  const [selectedDate, setSelectedDate] = useState('2026-11-26');
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');
  const [reason, setReason] = useState('Routine Chronic Care Checkup');

  const slots = ['09:30 AM', '10:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onBookSuccess({
      doctorName: selectedDoctor,
      date: selectedDate,
      time: selectedSlot,
      purpose: reason,
      hospital: 'Apollo Hospitals, Chennai',
      status: 'CONFIRMED',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2 text-brand-navy">
            <Calendar className="w-6 h-6 text-brand-teal" />
            <h3 className="text-xl font-extrabold">Schedule Doctor Visit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Treating Doctor
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
            >
              <option>Dr. Suresh Sharma, MD (Geriatric Cardiology - Apollo)</option>
              <option>Dr. Kavita Narayanan (Ophthalmology - Sankara Nethralaya)</option>
              <option>Dr. Arvind Swaminathan (Endocrinology - AIIMS)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Preferred Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Available Clinic Slots
            </label>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                    selectedSlot === slot
                      ? 'bg-brand-teal text-white border-brand-teal shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Visit Purpose / Symptoms
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-800"
            />
          </div>

          <div className="pt-4 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-brand-navy hover:bg-brand-navy-dark text-white font-extrabold rounded-xl text-sm shadow-md"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
