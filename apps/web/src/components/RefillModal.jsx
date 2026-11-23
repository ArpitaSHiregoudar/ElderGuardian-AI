import React from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, MapPin, X } from 'lucide-react';

export default function RefillModal({ isOpen, onClose, onConfirm, refillData }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2 text-amber-900">
            <RefreshCw className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-extrabold">Confirm Medicine Refill</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Selected Medicine</p>
            <h4 className="text-lg font-black text-slate-900 mt-1">Telmisartan 40mg (30 Tablets)</h4>
            <p className="text-xs text-slate-600">Blood Pressure Maintenance • 1 Month Supply</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Partner Pharmacy:</span>
              <span className="font-bold text-slate-800">Apollo Cathedral Rd</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Prescription Status:</span>
              <span className="font-bold text-emerald-700 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1" /> Active (Valid)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="font-bold text-slate-800">T. Nagar, Chennai</span>
            </div>
            <div className="flex justify-between py-1 pt-2 text-base font-extrabold">
              <span className="text-slate-900">Total Due (COD / UPI):</span>
              <span className="text-brand-navy">₹148.00</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
            🔒 By confirming, you authorize Apollo Pharmacy to dispense this prescribed medication with zero substitution.
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-sm shadow-md"
            >
              Authorize & Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
