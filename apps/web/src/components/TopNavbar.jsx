import React from 'react';
import { Heart, ShieldAlert, PhoneCall, UserCheck, Stethoscope, Users, Volume2 } from 'lucide-react';

export default function TopNavbar({ activeRole, setActiveRole, onSosClick, textScale, setTextScale }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Emergency Hotline Banner for Seniors */}
      <div className="bg-red-700 text-white px-4 py-2 flex items-center justify-between text-sm md:text-base font-semibold">
        <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center space-x-2">
            <span className="animate-pulse bg-white text-red-700 p-1 rounded-full text-xs font-black">SOS</span>
            <span>24/7 Geriatric Emergency Helpline: <strong>108 / 1800-425-4422</strong></span>
          </div>
          <button
            onClick={onSosClick}
            className="bg-white text-red-700 hover:bg-red-50 px-3 py-1 rounded-md text-xs md:text-sm font-bold flex items-center space-x-1 transition shadow-sm active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>TRIGGER EMERGENCY ESCALATION</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-brand-navy to-brand-teal rounded-2xl flex items-center justify-center text-white shadow-md">
            <Heart className="w-7 h-7 fill-white/90" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-brand-navy tracking-tight">
                ElderGuardian <span className="text-brand-teal font-black">AI</span>
              </h1>
              <span className="text-xs bg-brand-teal-light text-brand-teal-dark font-bold px-2 py-0.5 rounded-full border border-brand-teal/30">
                Hospital Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Care Journey Coordination • Geriatric Continuity Platform</p>
          </div>
        </div>

        {/* Accessibility & Role Selector Pills */}
        <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
          {/* Text Size Scale Toggle */}
          <div className="hidden lg:flex items-center bg-slate-100 rounded-lg p-1 text-xs font-bold text-slate-700 border border-slate-200">
            <span className="px-2 text-slate-500 font-medium">Text Size:</span>
            <button
              onClick={() => setTextScale('normal')}
              className={`px-2 py-1 rounded ${textScale === 'normal' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-600'}`}
            >
              Default
            </button>
            <button
              onClick={() => setTextScale('large')}
              className={`px-2 py-1 rounded ${textScale === 'large' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600'}`}
            >
              Large (18px)
            </button>
          </div>

          {/* Role Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveRole('PATIENT')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
                activeRole === 'PATIENT'
                  ? 'bg-brand-navy text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Senior Patient</span>
            </button>
            <button
              onClick={() => setActiveRole('FAMILY')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
                activeRole === 'FAMILY'
                  ? 'bg-brand-teal text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Family Caregiver</span>
            </button>
            <button
              onClick={() => setActiveRole('DOCTOR')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition ${
                activeRole === 'DOCTOR'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor OPD</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
