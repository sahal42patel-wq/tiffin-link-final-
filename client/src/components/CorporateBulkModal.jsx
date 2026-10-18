import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  FileText,
  Clock,
  TrendingDown,
  Award
} from 'lucide-react';
import { submitCorporateInquiry } from '../services/advancedFeaturesApi';

export default function CorporateBulkModal({ isOpen, onClose }) {
  const [companyName, setCompanyName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mealCount, setMealCount] = useState(25);
  const [billingPlan, setBillingPlan] = useState('monthly_invoice');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitCorporateInquiry({
        companyName,
        officeAddress,
        contactPerson,
        email,
        phone,
        mealCountDaily: mealCount,
        billingPreference: billingPlan
      });
      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (e) {
      alert('Inquiry received: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Corporate & Office Lunch Desk</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  B2B Desk
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Fresh, hygienic homestyle meals for IT parks, tech startups & enterprises
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Corporate Pilot Request Received!</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Our Corporate Relations Team will contact <strong>{contactPerson}</strong> at <strong>{companyName}</strong> today to schedule a <strong>Free Complimentary 5-Thali Tasting Session</strong> at your office.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Highlight Banner */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
                  <TrendingDown className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs font-black text-blue-900 dark:text-blue-300">Up to 30% OFF</div>
                  <div className="text-[10px] text-stone-500">Tiered Volume Pricing</div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
                  <FileText className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs font-black text-blue-900 dark:text-blue-300">GST Invoices</div>
                  <div className="text-[10px] text-stone-500">Input Tax Credit Ready</div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
                  <Award className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs font-black text-blue-900 dark:text-blue-300">100% Satvik</div>
                  <div className="text-[10px] text-stone-500">Ayush/FSSAI Audited</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Infosys / CyberTech Labs"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Office / Tech Park Location
                  </label>
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="e.g. Infocity Tower 2, Gandhinagar"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="HR / Ops Lead"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hr@company.com"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Direct Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Estimated Daily Headcount: <span className="text-blue-600 font-black">{mealCount} Meals / Day</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={mealCount}
                  onChange={(e) => setMealCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-semibold mt-1">
                  <span>10 Meals</span>
                  <span>100 Meals</span>
                  <span>300+ Enterprise Meals</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Corporate Subsidy Model
                </label>
                <select
                  value={billingPlan}
                  onChange={(e) => setBillingPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly_invoice">100% Company Sponsored (Monthly GST Invoice)</option>
                  <option value="copay_50_50">50-50 Co-Pay (Company Subsidizes Half, Employee Pays Half)</option>
                  <option value="employee_direct_discount">Employee Direct Pay with Corporate 20% Discount</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition shadow"
              >
                {loading ? 'Submitting...' : 'Request Corporate Proposal & Free Tasting Box'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
