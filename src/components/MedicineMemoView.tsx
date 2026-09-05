import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  Share2,
  RotateCcw,
  Sparkles,
  Pill,
  CheckCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  MedicineItem,
  ActiveMedicineState,
  SavedMemo,
  UserSettings,
  MedicineCalcMethod,
  MedicinePriceType,
} from '../types';
import { calculateMedicine } from '../utils/medicineCalc';
import { formatCurrency, formatNum, getTodayFormatted, getTimeFormatted } from '../utils/numberFormat';

interface MedicineMemoViewProps {
  medicineState: ActiveMedicineState;
  onUpdateState: (newState: ActiveMedicineState) => void;
  onSaveAsMemo: (memo: SavedMemo) => void;
  onOpenShareModal: (memo: SavedMemo) => void;
  settings: UserSettings;
  isAddModalOpenInitially?: boolean;
}

export const MedicineMemoView: React.FC<MedicineMemoViewProps> = ({
  medicineState,
  onUpdateState,
  onSaveAsMemo,
  onOpenShareModal,
  settings,
  isAddModalOpenInitially = false,
}) => {
  const isBn = settings.numberFormat === 'bn';
  const [filter, setFilter] = useState<'all' | 'needed' | 'stocked'>('all');

  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [editingItem, setEditingItem] = useState<MedicineItem | null>(null);

  // Form states for Medicine Add / Edit
  const [formName, setFormName] = useState('');
  const [formStripSize, setFormStripSize] = useState<number>(10);
  const [formCurrentStrips, setFormCurrentStrips] = useState<number>(0);
  const [formCurrentPieces, setFormCurrentPieces] = useState<number>(0);
  const [formCalcMethod, setFormCalcMethod] = useState<MedicineCalcMethod>('monthly');
  const [formDailyUsage, setFormDailyUsage] = useState<number>(2);
  const [formMonthlyStrips, setFormMonthlyStrips] = useState<number>(1);
  const [formMonthlyPieces, setFormMonthlyPieces] = useState<number>(0);
  const [formPriceType, setFormPriceType] = useState<MedicinePriceType>('strip');
  const [formUnitPrice, setFormUnitPrice] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculations across all medicines
  let totalMedicinesCount = medicineState.items.length;
  let totalShortageCount = 0;
  let totalInStockCount = 0;
  let totalEstimatedPurchaseCost = 0;

  medicineState.items.forEach((item) => {
    const calc = calculateMedicine(item, isBn);
    if (calc.isShortage || calc.finalTotalPieces > 0) {
      totalShortageCount += 1;
    } else {
      totalInStockCount += 1;
    }
    totalEstimatedPurchaseCost += calc.estimatedCost;
  });

  // Title change (Auto-saved)
  const handleTitleChange = (newTitle: string) => {
    onUpdateState({ ...medicineState, title: newTitle });
  };

  // Purchase quantity stepper adjustments
  const handleAdjustFinalPurchase = (item: MedicineItem, deltaStrips: number) => {
    const calc = calculateMedicine(item, isBn);
    const currentStrips = item.isPurchaseOverridden
      ? item.finalPurchaseStrips ?? calc.finalPurchaseStrips
      : calc.finalPurchaseStrips;
    const currentPieces = item.isPurchaseOverridden
      ? item.finalPurchasePieces ?? calc.finalPurchasePieces
      : calc.finalPurchasePieces;

    const newStrips = Math.max(0, currentStrips + deltaStrips);

    const updated = medicineState.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          finalPurchaseStrips: newStrips,
          finalPurchasePieces: currentPieces,
          isPurchaseOverridden: true,
        };
      }
      return i;
    });
    onUpdateState({ ...medicineState, items: updated });
  };

  // Round up to full strip
  const handleRoundUpToFullStrips = (item: MedicineItem) => {
    const calc = calculateMedicine(item, isBn);
    const fullStrips = Math.ceil(calc.shortagePieces / (item.stripSize || 10));
    const updated = medicineState.items.map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          finalPurchaseStrips: Math.max(1, fullStrips),
          finalPurchasePieces: 0,
          isPurchaseOverridden: true,
        };
      }
      return i;
    });
    onUpdateState({ ...medicineState, items: updated });
  };

  // Reset to auto calculation
  const handleResetToAuto = (itemId: string) => {
    const updated = medicineState.items.map((i) => {
      if (i.id === itemId) {
        return {
          ...i,
          isPurchaseOverridden: false,
          finalPurchaseStrips: undefined,
          finalPurchasePieces: undefined,
        };
      }
      return i;
    });
    onUpdateState({ ...medicineState, items: updated });
  };

  // Delete Medicine
  const handleDeleteItem = (id: string) => {
    const updated = medicineState.items.filter((item) => item.id !== id);
    onUpdateState({ ...medicineState, items: updated });
  };

  // Modal Openers
  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormStripSize(10);
    setFormCurrentStrips(0);
    setFormCurrentPieces(0);
    setFormCalcMethod('monthly');
    setFormDailyUsage(2);
    setFormMonthlyStrips(1);
    setFormMonthlyPieces(0);
    setFormPriceType('strip');
    setFormUnitPrice('');
    setFormNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MedicineItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormStripSize(item.stripSize || 10);
    setFormCurrentStrips(item.currentStockStrips || 0);
    setFormCurrentPieces(item.currentStockPieces || 0);
    setFormCalcMethod(item.calcMethod || 'monthly');
    setFormDailyUsage(item.dailyRequirement || 2);
    setFormMonthlyStrips(item.monthlyRequirementStrips || 1);
    setFormMonthlyPieces(item.monthlyRequirementPieces || 0);
    setFormPriceType(item.priceType || 'strip');
    setFormUnitPrice(item.unitPrice ? String(item.unitPrice) : '');
    setFormNote(item.note || '');
    setIsModalOpen(true);
  };

  // Form Submit
  const handleSaveModalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedPrice = formUnitPrice.trim() ? parseFloat(formUnitPrice) : null;
    const cleanPrice = parsedPrice && !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;

    if (editingItem) {
      const updated = medicineState.items.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: formName.trim(),
            stripSize: formStripSize,
            currentStockStrips: formCurrentStrips,
            currentStockPieces: formCurrentPieces,
            calcMethod: formCalcMethod,
            dailyRequirement: formDailyUsage,
            monthlyRequirementStrips: formMonthlyStrips,
            monthlyRequirementPieces: formMonthlyPieces,
            priceType: formPriceType,
            unitPrice: cleanPrice,
            note: formNote.trim() || undefined,
          };
        }
        return item;
      });
      onUpdateState({ ...medicineState, items: updated });
    } else {
      const newItem: MedicineItem = {
        id: `med-${Date.now()}`,
        name: formName.trim(),
        stripSize: formStripSize,
        currentStockStrips: formCurrentStrips,
        currentStockPieces: formCurrentPieces,
        calcMethod: formCalcMethod,
        dailyRequirement: formDailyUsage,
        monthlyRequirementStrips: formMonthlyStrips,
        monthlyRequirementPieces: formMonthlyPieces,
        priceType: formPriceType,
        unitPrice: cleanPrice,
        note: formNote.trim() || undefined,
        finalPurchaseStrips: 0,
        finalPurchasePieces: 0,
        isPurchaseOverridden: false,
        createdAt: Date.now(),
      };
      onUpdateState({
        ...medicineState,
        items: [newItem, ...medicineState.items],
      });
    }

    setIsModalOpen(false);
  };

  // Snapshot generation helper
  const createCurrentMemoSnapshot = (neededOnly: boolean = false): SavedMemo => {
    const itemsToInclude = neededOnly
      ? medicineState.items.filter((item) => {
          const calc = calculateMedicine(item, isBn);
          return calc.isShortage || calc.finalTotalPieces > 0;
        })
      : medicineState.items;

    let memoTotal = 0;
    itemsToInclude.forEach((item) => {
      const calc = calculateMedicine(item, isBn);
      memoTotal += calc.estimatedCost;
    });

    return {
      id: `saved-med-${Date.now()}`,
      title: medicineState.title || 'ঔষধের মেমো',
      type: 'medicine_full',
      date: getTodayFormatted(settings.dateFormat),
      time: getTimeFormatted(),
      timestamp: Date.now(),
      medicineItems: [...itemsToInclude],
      totalPrice: memoTotal,
      itemCount: itemsToInclude.length,
    };
  };

  // FINALISE MEDICINE MEMO (Requirement 7)
  // 1. Saves exact purchase snapshot into SavedMemos
  // 2. Fulfills purchase shortage in active medicines so they are no longer pending
  // 3. Keeps permanent medicine profiles (name, dosage, etc.) in the active catalog
  const handleFinalizeMedicineMemo = () => {
    // Only items that need purchasing
    const neededItems = medicineState.items.filter((item) => {
      const calc = calculateMedicine(item, isBn);
      return calc.isShortage || calc.finalTotalPieces > 0;
    });

    if (neededItems.length === 0) {
      showToast('কোনো ঔষধের ঘাটতি বা কেনার পরিমাণ নেই!');
      return;
    }

    const memoSnapshot = createCurrentMemoSnapshot(true);
    onSaveAsMemo(memoSnapshot);

    // Update active medicine stocks: fulfill the purchase shortage
    const updatedItems = medicineState.items.map((item) => {
      const calc = calculateMedicine(item, isBn);
      if (calc.isShortage || calc.finalTotalPieces > 0) {
        // Stock is increased by purchased quantity
        const addedPieces = calc.finalTotalPieces;
        const totalPiecesNow =
          (item.currentStockStrips || 0) * (item.stripSize || 10) +
          (item.currentStockPieces || 0) +
          addedPieces;
        const newStrips = Math.floor(totalPiecesNow / (item.stripSize || 10));
        const newPieces = totalPiecesNow % (item.stripSize || 10);

        return {
          ...item,
          currentStockStrips: newStrips,
          currentStockPieces: newPieces,
          finalPurchaseStrips: 0,
          finalPurchasePieces: 0,
          isPurchaseOverridden: false,
        };
      }
      return item;
    });

    onUpdateState({
      ...medicineState,
      items: updatedItems,
      updatedAt: Date.now(),
    });

    showToast('মেমো সংরক্ষিত হয়েছে এবং ঔষধের স্টক আপডেট করা হয়েছে!');
  };

  const handleShareCurrent = () => {
    const memo = createCurrentMemoSnapshot(false);
    onOpenShareModal(memo);
  };

  // Filter items
  const filteredItems = medicineState.items.filter((item) => {
    const calc = calculateMedicine(item, isBn);
    const isNeeded = calc.isShortage || calc.finalTotalPieces > 0;
    if (filter === 'needed') return isNeeded;
    if (filter === 'stocked') return !isNeeded;
    return true;
  });

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* Memo Title Bar (Editable with Auto-Save) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          মেমো শিরোনাম (অটো-সেভ হবে)
        </label>
        <input
          type="text"
          value={medicineState.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="ঔষধের মেমোর নাম দিন..."
          className="w-full text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-sky-600 focus:outline-hidden py-1 px-0 transition bg-transparent"
        />
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-slate-500">মোট ঔষধ</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">
            {formatNum(totalMedicinesCount, isBn)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-rose-700">কেনার প্রয়োজন</span>
          <div className="text-lg font-extrabold text-rose-700 mt-0.5">
            {formatNum(totalShortageCount, isBn)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-emerald-700">পর্যাপ্ত স্টক</span>
          <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
            {formatNum(totalInStockCount, isBn)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-slate-600">মোট আনুমানিক</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">
            {formatCurrency(totalEstimatedPurchaseCost, settings.currency, isBn)}
          </div>
        </div>
      </div>

      {/* Primary Actions Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={openAddModal}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-2xl shadow-sm active:scale-98 transition text-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ঔষধ যোগ করুন</span>
        </button>

        <button
          onClick={handleFinalizeMedicineMemo}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-3.5 rounded-2xl active:scale-98 transition text-xs border border-slate-200"
          title="মেমো হিসেবে সেভ করুন ও স্টক আপডেট করুন"
        >
          <Save className="w-4 h-4 text-sky-700" />
          <span>মেমো ফাইনাল</span>
        </button>

        <button
          onClick={handleShareCurrent}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-3 rounded-2xl active:scale-98 transition text-xs border border-slate-200"
          title="মেমো শেয়ার করুন"
        >
          <Share2 className="w-4 h-4 text-slate-700" />
          <span className="hidden sm:inline">শেয়ার</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-700 text-white text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2 shadow-sm animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          সব ({formatNum(totalMedicinesCount, isBn)})
        </button>
        <button
          onClick={() => setFilter('needed')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center ${
            filter === 'needed'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          কেনার প্রয়োজন ({formatNum(totalShortageCount, isBn)})
        </button>
        <button
          onClick={() => setFilter('stocked')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center ${
            filter === 'stocked'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          পর্যাপ্ত স্টক ({formatNum(totalInStockCount, isBn)})
        </button>
      </div>

      {/* Medicine Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center">
          <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 mx-auto mb-3">
            <Pill className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">কোনো ঔষধ পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {filter === 'needed'
              ? 'বর্তমানে কোনো ঔষধের কেনার ঘাটতি নেই। সব ঔষধ পর্যাপ্ত স্টকে আছে।'
              : 'নতুন ঔষধ যোগ করতে "ঔষধ যোগ করুন" বাটনে চাপ দিন।'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const calc = calculateMedicine(item, isBn);
            const hasShortage = calc.isShortage || calc.finalTotalPieces > 0;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs transition space-y-3 ${
                  hasShortage ? 'border-sky-200 ring-1 ring-sky-500/10' : 'border-slate-200'
                }`}
              >
                {/* Header: Name, Strip Size, Edit/Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        hasShortage ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ১ পাতা = {formatNum(item.stripSize || 10, isBn)} পিস
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="এডিট করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stock & Monthly Requirement Stats */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">বর্তমান স্টক</span>
                    <strong className="text-slate-900 font-bold">
                      {calc.currentStockLabelBn}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">মাসিক প্রয়োজন</span>
                    <strong className="text-slate-700 font-bold">
                      {calc.monthlyNeedLabelBn}
                    </strong>
                  </div>
                </div>

                {/* Purchase / Shortage Quantity Controller */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      কেনার পরিমাণ {item.isPurchaseOverridden && '(কাস্টম)'}
                    </span>
                    <strong
                      className={`text-sm font-extrabold ${
                        hasShortage ? 'text-rose-700' : 'text-slate-400'
                      }`}
                    >
                      {calc.finalPurchaseLabelBn}
                    </strong>
                  </div>

                  {/* Stepper buttons for quick adjustment */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustFinalPurchase(item, -1)}
                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center transition active:scale-95 text-xs"
                      title="১ পাতা কমান"
                    >
                      -১
                    </button>

                    <button
                      onClick={() => handleAdjustFinalPurchase(item, 1)}
                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center transition active:scale-95 text-xs"
                      title="১ পাতা বাড়ান"
                    >
                      +১
                    </button>

                    {calc.shortagePieces > 0 && (
                      <button
                        onClick={() => handleRoundUpToFullStrips(item)}
                        className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[10px] font-bold rounded-lg border border-sky-200 transition"
                        title="পূর্ণ পাতায় রাউন্ড আপ"
                      >
                        পূর্ণ পাতা
                      </button>
                    )}

                    {item.isPurchaseOverridden && (
                      <button
                        onClick={() => handleResetToAuto(item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="অটো হিসাবে রিসেট করুন"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Estimated Cost Row */}
                {calc.estimatedCost > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">আনুমানিক খরচ:</span>
                    <strong className="text-sky-800 font-extrabold">
                      {formatCurrency(calc.estimatedCost, settings.currency, isBn)}
                    </strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MEDICINE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingItem ? 'ঔষধ সম্পাদনা' : 'নতুন ঔষধ যোগ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModalForm} className="p-4 overflow-y-auto space-y-3.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ঔষধের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: Napa Extra, Seclo 20mg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ১ পাতায় পিস
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formStripSize}
                    onChange={(e) => setFormStripSize(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বর্তমান স্টক (পাতা)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCurrentStrips}
                    onChange={(e) => setFormCurrentStrips(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বর্তমান স্টক (খুচরা পিস)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCurrentPieces}
                    onChange={(e) => setFormCurrentPieces(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    হিসাব পদ্ধতি
                  </label>
                  <select
                    value={formCalcMethod}
                    onChange={(e) => setFormCalcMethod(e.target.value as MedicineCalcMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  >
                    <option value="monthly">মাসিক পাতা দিয়ে</option>
                    <option value="daily">দৈনিক ডোজ দিয়ে (৩০ দিন)</option>
                  </select>
                </div>
              </div>

              {formCalcMethod === 'daily' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    দৈনিক কত পিস খাওয়া হয়?
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formDailyUsage}
                    onChange={(e) => setFormDailyUsage(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    মাসিক প্রয়োজন: {formatNum(Math.round(formDailyUsage * 30), isBn)} পিস
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মাসিক প্রয়োজন (পাতা)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMonthlyStrips}
                      onChange={(e) => setFormMonthlyStrips(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মাসিক প্রয়োজন (পিস)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMonthlyPieces}
                      onChange={(e) => setFormMonthlyPieces(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    দর হিসাব
                  </label>
                  <select
                    value={formPriceType}
                    onChange={(e) => setFormPriceType(e.target.value as MedicinePriceType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  >
                    <option value="strip">প্রতি পাতা</option>
                    <option value="piece">প্রতি পিস</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আনুমানিক মূল্য (টাকা)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    placeholder="যেমন: ৩০"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="যেমন: খাওয়ার পর"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-sky-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-sm active:scale-98 transition"
                >
                  {editingItem ? 'পরিবর্তন সংরক্ষণ করুন' : 'ঔষধ তালিকায় যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
