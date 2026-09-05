import React, { useRef, useState } from 'react';
import {
  User,
  DollarSign,
  Globe,
  Calendar,
  Share2,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  HardDrive,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { UserSettings } from '../types';
import { exportAllDataAsJSON, importDataFromJSON, clearAllData } from '../services/db';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleFieldChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    setSaveMessage('সেটিংস সংরক্ষিত হয়েছে');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  // Backup Export
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonString = await exportAllDataAsJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MY_MEMO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      alert('ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } catch (err) {
      console.error(err);
      alert('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsExporting(false);
    }
  };

  // Backup Import
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('এই ব্যাকআপ ফাইলটি রিস্টোর করলে বর্তমান ডাটার সাথে নতুন ডাটা যুক্ত/আপডেট হবে। আপনি কি এগিয়ে যেতে চান?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      await importDataFromJSON(text);
      alert('ডাটা সফলভাবে রিস্টোর করা হয়েছে!');
      onDataReset();
    } catch (err: any) {
      console.error(err);
      alert(`রিস্টোর ব্যর্থ হয়েছে: ${err.message || 'ভুল ফরম্যাটের ফাইল'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleConfirmClearAll = async () => {
    try {
      await clearAllData();
      setShowClearConfirm(false);
      alert('অ্যাপের সমস্ত ডাটা মুছে ফেলা হয়েছে।');
      onDataReset();
    } catch (err) {
      console.error(err);
      alert('ডাটা মুছতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* Settings Top Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">⚙️ অ্যাপ সেটিংস</h2>
          <p className="text-xs text-slate-500 mt-0.5">আপনার পছন্দমতো কনফিগারেশন পরিবর্তন করুন</p>
        </div>
        {saveMessage && (
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Profile & Name */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span>ব্যবহারকারীর প্রোফাইল ও মেমো হেডার</span>
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            আপনার নাম (মেমো হেডার এবং ছবি/PDF-এ প্রদর্শিত হবে)
          </label>
          <input
            type="text"
            value={settings.userName}
            onChange={(e) => handleFieldChange('userName', e.target.value)}
            placeholder="যেমন: Iftikhar Ahmed"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold focus:outline-hidden"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            মেমো ডাউনলোড বা শেয়ার করার সময় এই নামটি তারিখের নিচে স্পষ্টভাবে দৃশ্যমান থাকবে।
          </span>
        </div>
      </div>

      {/* Preferences: Currency & Number format */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>মুদ্রা ও সংখ্যা ফরম্যাট</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Currency Symbol */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মুদ্রার প্রতীক
            </label>
            <input
              type="text"
              value={settings.currency}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              placeholder="যেমন: ৳, $, ₹"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:outline-hidden"
            />
          </div>

          {/* Number system */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সংখ্যার ধরন
            </label>
            <select
              value={settings.numberFormat}
              onChange={(e) => handleFieldChange('numberFormat', e.target.value as 'bn' | 'en')}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs focus:outline-hidden"
            >
              <option value="bn">বাংলা সংখ্যা (১২৩৪৫)</option>
              <option value="en">English Digits (12345)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ডিফল্ট শেয়ার ফরম্যাট
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['image', 'pdf', 'text'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleFieldChange('defaultShareFormat', fmt)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  settings.defaultShareFormat === fmt
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {fmt === 'image' ? '🖼️ ছবি (Image)' : fmt === 'pdf' ? '📄 PDF মেমো' : '📋 টেক্সট'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          <span>ব্যাকআপ ও রিস্টোর (অফলাইন ডাটা নিরাপত্তা)</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          আপনার সমস্ত ডাটা ব্রাউজারের লোকাল মেমোরি (IndexedDB)-তে সংরক্ষিত থাকে। ফোন পরিবর্তন বা ব্রাউজার ক্যাশ ক্লিয়ার করার পূর্বে ব্যাকআপ ফাইল ডাউনলোড করে রাখা নিরাপদ।
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Export Button */}
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active:scale-98 transition shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'তৈরি হচ্ছে...' : 'ব্যাকআপ নিন (JSON)'}</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold active:scale-98 transition shadow-xs disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'রিস্টোর হচ্ছে...' : 'রিস্টোর করুন'}</span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>সতর্কতা অঞ্চল (Danger Zone)</span>
        </h3>
        <p className="text-xs text-rose-700 leading-relaxed">
          সমস্ত সংরক্ষিত মেমো, বর্তমান বাজার তালিকা ও ঔষধের ডাটা স্থায়ীভাবে মুছে ফেলতে চাইলে নিচের বোতামটি ব্যবহার করুন।
        </p>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold active:scale-98 transition shadow-xs"
        >
          <Trash2 className="w-4 h-4" />
          <span>অ্যাপের সব ডাটা মুছে ফেলুন</span>
        </button>
      </div>

      {/* About Application Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <strong className="text-slate-800">MY MEMO — ১০০% অফলাইন ও ব্যক্তিগত</strong>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          এই অ্যাপটি আপনার ডিভাইসের বাইরে কোনো ইন্টারনেটে কোনো তথ্য আদান-প্রদান করে না। কোনো ক্লাউড সার্ভার বা লগইনের প্রয়োজন নেই।
        </p>
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>ভার্সন: ১.০.০ (PWA)</span>
          <span>Designed for Android Mobile</span>
        </div>
      </div>

      {/* Confirmation Modal for Clearing All Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-rose-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              আপনি কি নিশ্চিত?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              এই প্রক্রিয়াটি সম্পন্ন হলে আপনার বর্তমান বাজারের তালিকা, ঔষধের হিসাব ও সংরক্ষিত সমস্ত মেমো চিরতরে মুছে যাবে।
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold active:scale-98"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
