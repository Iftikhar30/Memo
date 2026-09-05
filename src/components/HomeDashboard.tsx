import React from 'react';
import {
  ShoppingCart,
  Pill,
  BookMarked,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  Share2,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { ActiveTab, ActiveMarketState, ActiveMedicineState, SavedMemo, UserSettings } from '../types';
import { calculateMedicine } from '../utils/medicineCalc';
import { formatCurrency, formatNum, getTodayFormatted } from '../utils/numberFormat';

interface HomeDashboardProps {
  onNavigate: (tab: ActiveTab) => void;
  marketState: ActiveMarketState;
  medicineState: ActiveMedicineState;
  savedMemos: SavedMemo[];
  settings: UserSettings;
  onOpenShareModal: (memo: SavedMemo) => void;
  onOpenAddMarketModal: () => void;
  onOpenAddMedicineModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  marketState,
  medicineState,
  savedMemos,
  settings,
  onOpenShareModal,
  onOpenAddMarketModal,
  onOpenAddMedicineModal,
}) => {
  const isBn = settings.numberFormat === 'bn';

  // Market stats
  const marketTotalCount = marketState.items.length;
  const marketPurchasedCount = marketState.items.filter((i) => i.isPurchased).length;
  const marketPendingCount = marketTotalCount - marketPurchasedCount;
  const marketEstimatedTotal = marketState.items.reduce((sum, item) => {
    return sum + (item.pricePerUnit ? item.quantity * item.pricePerUnit : 0);
  }, 0);

  // Medicine stats
  let medicineNeedBuyCount = 0;
  let medicineTotalEstimatedCost = 0;
  medicineState.items.forEach((item) => {
    const calc = calculateMedicine(item, isBn);
    if (calc.isShortage || calc.finalTotalPieces > 0) {
      medicineNeedBuyCount += 1;
    }
    medicineTotalEstimatedCost += calc.estimatedCost;
  });
  if (medicineState.items.length === 0 && medicineState.requiredItems?.length > 0) {
    medicineNeedBuyCount = medicineState.requiredItems.length;
  }

  const recentSaved = savedMemos.slice(0, 3);

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Welcome & Date Greeting Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between text-xs text-emerald-200/90 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {getTodayFormatted(settings.dateFormat)}
            </span>
            <span className="bg-emerald-500/30 px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-100 border border-emerald-400/20">
              100% অফলাইন প্রস্তুত
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">
            স্বাগতম, {settings.userName || 'Iftikhar Ahmed'}
          </h2>
          <p className="text-xs text-emerald-100/80 leading-relaxed max-w-xs">
            আপনার প্রয়োজনীয় বাজারের ও ঔষধের হিসাব এক জায়গায় গুছিয়ে রাখুন।
          </p>

          {/* Quick Stat Pill Row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
            <div className="bg-white/10 rounded-xl py-1.5 px-1 backdrop-blur-xs">
              <div className="text-base font-extrabold text-white">
                {formatNum(marketPendingCount, isBn)}
              </div>
              <div className="text-[10px] text-emerald-200 font-medium">বাজার বাকি</div>
            </div>
            <div className="bg-white/10 rounded-xl py-1.5 px-1 backdrop-blur-xs">
              <div className="text-base font-extrabold text-amber-300">
                {formatNum(medicineNeedBuyCount, isBn)}
              </div>
              <div className="text-[10px] text-emerald-200 font-medium">ঔষধ প্রয়োজন</div>
            </div>
            <div className="bg-white/10 rounded-xl py-1.5 px-1 backdrop-blur-xs">
              <div className="text-base font-extrabold text-white">
                {formatNum(savedMemos.length, isBn)}
              </div>
              <div className="text-[10px] text-emerald-200 font-medium">সংরক্ষিত মেমো</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary Navigation Cards (Mobile-First Large Touch Friendly) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          প্রধান মেন্যু
        </h3>

        {/* 1. 🛒 বাজারের মেমো */}
        <div
          onClick={() => onNavigate('market')}
          className="group relative bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    🛒 বাজারের মেমো
                  </h4>
                  {marketPendingCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {formatNum(marketPendingCount, isBn)}টি বাকি
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  চাল, ডাল, তেল, শাকসবজি ও নিত্যপণ্যের কেনাকাটার তালিকা
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-700">
                  <span>মোট পণ্য: <strong className="text-emerald-700">{formatNum(marketTotalCount, isBn)}</strong></span>
                  <span>•</span>
                  <span>আনুমানিক: <strong className="text-slate-900">{formatCurrency(marketEstimatedTotal, settings.currency, isBn)}</strong></span>
                </div>
              </div>
            </div>
            <div className="p-2 text-slate-400 group-hover:text-emerald-600 transition">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Quick Inline Add Button */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">সরাসরি কাজ শুরু করুন</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddMarketModal();
              }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন পণ্য যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* 2. 💊 ঔষধের মেমো */}
        <div
          onClick={() => onNavigate('medicine')}
          className="group relative bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Pill className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    💊 ঔষধের মেমো
                  </h4>
                  {medicineNeedBuyCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {formatNum(medicineNeedBuyCount, isBn)}টি কিনতে হবে
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  পাতা ও পিস হিসাব, স্মার্ট ঘাটতি ও ক্রয় তালিকা
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-700">
                  <span>মোড: <strong className="text-sky-700">{medicineState.mode === 'full' ? 'পূর্ণাঙ্গ স্টক' : 'প্রয়োজনীয় তালিকা'}</strong></span>
                  <span>•</span>
                  <span>আনুমানিক: <strong className="text-slate-900">{formatCurrency(medicineTotalEstimatedCost, settings.currency, isBn)}</strong></span>
                </div>
              </div>
            </div>
            <div className="p-2 text-slate-400 group-hover:text-sky-600 transition">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Quick Inline Add Button */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">স্মার্ট পাতা ও পিস ক্যালকুলেটর</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddMedicineModal();
              }}
              className="flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন ঔষধ যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* 3. 📋 Saved Memos & 4. ⚙️ Settings (2-column layout for one-hand access) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Saved Memos */}
          <div
            onClick={() => onNavigate('saved')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <BookMarked className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              📋 Saved Memos
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {formatNum(savedMemos.length, isBn)}টি সংরক্ষিত মেমো
            </p>
            <div className="mt-3 text-[11px] font-bold text-purple-700 flex items-center gap-1">
              <span>দেখুন</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Settings */}
          <div
            onClick={() => onNavigate('settings')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
              <Settings className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              ⚙️ Settings
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ব্যাকআপ, নাম ও মুদ্রা
            </p>
            <div className="mt-3 text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span>কনফিগার</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Saved Memos Section */}
      {recentSaved.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              সম্প্রতি সংরক্ষিত মেমো
            </h3>
            <button
              onClick={() => onNavigate('saved')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              সব দেখুন ({formatNum(savedMemos.length, isBn)})
            </button>
          </div>

          <div className="space-y-2.5">
            {recentSaved.map((memo) => (
              <div
                key={memo.id}
                className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                    memo.type === 'market' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {memo.type === 'market' ? '🛒' : '💊'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                      {memo.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{memo.date}</span>
                      <span>•</span>
                      <span>{formatNum(memo.itemCount, isBn)}টি আইটেম</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">{formatCurrency(memo.totalPrice, settings.currency, isBn)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenShareModal(memo)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
                  title="শেয়ার করুন"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
