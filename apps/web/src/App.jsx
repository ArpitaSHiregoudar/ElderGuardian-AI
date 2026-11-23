import React, { useState } from 'react';
import TopNavbar from './components/TopNavbar.jsx';
import PatientView from './components/PatientView.jsx';
import FamilyView from './components/FamilyView.jsx';
import DoctorView from './components/DoctorView.jsx';
import BookAppointmentModal from './components/BookAppointmentModal.jsx';
import RefillModal from './components/RefillModal.jsx';
import EmergencyModal from './components/EmergencyModal.jsx';
import { INITIAL_DATA } from './data/mockData.js';

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeRole, setActiveRole] = useState('PATIENT'); // 'PATIENT' | 'FAMILY' | 'DOCTOR'
  const [textScale, setTextScale] = useState('normal'); // 'normal' | 'large'
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Medication dose interactions
  const handleTakeDose = (medId) => {
    setData((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === medId ? { ...m, status: 'TAKEN' } : m,
      ),
    }));
    showToast('✓ Dose recorded as TAKEN! Synced with Caregiver dashboard.');
  };

  const handleSkipDose = (medId) => {
    setData((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === medId ? { ...m, status: 'SKIPPED' } : m,
      ),
    }));
    showToast('Dose recorded as SKIPPED.');
  };

  // Refill approval
  const handleApproveRefill = (refId) => {
    setData((prev) => ({
      ...prev,
      refillRequests: prev.refillRequests.map((r) =>
        r.id === refId ? { ...r, status: 'DISPATCHED_TO_PHARMACY' } : r,
      ),
    }));
    showToast('✓ Refill order approved and sent to Apollo Pharmacy!');
  };

  // Doctor writes prescription
  const handleAddPrescription = (newRx) => {
    const newMed = {
      id: `med-${Date.now()}`,
      name: newRx.name,
      generic: 'Doctor Authorized Prescribed Drug',
      purpose: 'Clinical Regimen Adjustment',
      timing: '09:00 AM Daily',
      timeCategory: 'morning',
      dosage: newRx.dosage,
      color: 'teal',
      remainingPills: 30,
      totalPills: 30,
      depletionDays: 30,
      status: 'PENDING',
    };
    setData((prev) => ({
      ...prev,
      medications: [newMed, ...prev.medications],
    }));
    showToast(`✓ Prescription issued for ${newRx.name}. Patient dashboard updated!`);
  };

  // Book appointment
  const handleBookAppointment = (newApt) => {
    setData((prev) => ({
      ...prev,
      appointments: [
        {
          id: `apt-${Date.now()}`,
          ...newApt,
          type: 'IN_PERSON',
          room: 'OPD Block B',
        },
        ...prev.appointments,
      ],
    }));
    showToast(`✓ Appointment confirmed with ${newApt.doctorName} for ${newApt.date}!`);
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${textScale === 'large' ? 'text-elder-base' : 'text-base'}`}>
      {/* Top Navbar with SOS & Role Switcher */}
      <TopNavbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onSosClick={() => setIsEmergencyOpen(true)}
        textScale={textScale}
        setTextScale={setTextScale}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-slideUp">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeRole === 'PATIENT' && (
          <PatientView
            data={data}
            onTakeDose={handleTakeDose}
            onSkipDose={handleSkipDose}
            onBookApt={() => setIsBookModalOpen(true)}
            onRefillClick={() => setIsRefillModalOpen(true)}
          />
        )}

        {activeRole === 'FAMILY' && (
          <FamilyView
            data={data}
            onApproveRefill={handleApproveRefill}
            onCallParent={() => alert(`Dialing Ramesh Kumar at ${data.patient.emergencyContact.phone}...`)}
          />
        )}

        {activeRole === 'DOCTOR' && (
          <DoctorView
            data={data}
            onAddPrescription={handleAddPrescription}
          />
        )}
      </main>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onBookSuccess={handleBookAppointment}
      />

      <RefillModal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        onConfirm={() => {
          showToast('✓ Refill request sent to Apollo Pharmacy Cathedral Rd branch.');
        }}
        refillData={data.refillRequests[0]}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        patient={data.patient}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 ElderGuardian AI Technologies. DPDP Act 2023 & ABDM Compliant.</p>
          <p className="font-semibold text-slate-600">
            Care Journey Engine: Consultation → Prescription → Medication → Refill → Delivery → Diagnostics → Follow-up
          </p>
        </div>
      </footer>
    </div>
  );
}
