import React, { useEffect, useState } from 'react';
import { Check, CloudOff, Download, RefreshCw, ShoppingBag } from 'lucide-react';
import { onSaveStatusChange } from '../services/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const Header: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isOnline = useOnlineStatus();
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const unsubscribe = onSaveStatusChange((status) => {
      setSaveStatus(status);
      if (status === 'saved') {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setSaveStatus('idle');
        }, 2200);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 font-sans">
                MY MEMO
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                লোকাল
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-none mt-0.5">
              অফলাইন মেমো ম্যানেজার
            </p>
          </div>
        </div>

        {/* Status Indicators & Install Button */}
        <div className="flex items-center gap-2">
          {/* Save Status Badge */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold animate-pulse border border-slate-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>সংরক্ষণ হচ্ছে...</span>
            </div>
          )}

          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all duration-300 shadow-xs">
              <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
              <span>✓ সংরক্ষিত</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
              <span>সংরক্ষণ ত্রুটি</span>
            </div>
          )}

          {/* Offline Pill if network drops */}
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300">
              <CloudOff className="w-3 h-3 text-amber-700" />
              <span>অফলাইন</span>
            </div>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition"
              title="অ্যাপ ইনস্টল করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ইনস্টল</span>
            </button>
          )}

          {isIOS && !isInstallable && (
            <button
              onClick={() => setShowIOSPrompt(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ইনস্টল</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Install Guide Dialog */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">হোম স্ক্রিনে যোগ করুন</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              সাফারি ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করে <strong>"Add to Home Screen"</strong> নির্বাচন করুন।
            </p>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold active:bg-emerald-700"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
