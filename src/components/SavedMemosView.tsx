import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Eye,
  Edit2,
  Copy,
  Share2,
  Trash2,
  Calendar,
  Clock,
  Plus,
  ShoppingBag,
  Pill,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  SavedMemo,
  UserSettings,
  MarketItem,
  MedicineItem,
  RequiredMedicineItem,
  MarketUnit,
} from '../types';
import { formatCurrency, formatNum, getTodayFormatted, getTimeFormatted } from '../utils/numberFormat';
import { calculateMedicine } from '../utils/medicineCalc';

interface SavedMemosViewProps {
  savedMemos: SavedMemo[];
  onUpdateMemo: (memo: SavedMemo) => void;
  onDeleteMemo: (id: string) => void;
  onDuplicateMemo: (memo: SavedMemo) => void;
  onLoadIntoActive: (memo: SavedMemo) => void;
  onOpenShareModal: (memo: SavedMemo) => void;
  settings: UserSettings;
}

const MARKET_UNITS: MarketUnit[] = [
  'কেজি',
  'গ্রাম',
  'লিটার',
  'মিলিলিটার',
  'পিস',
  'প্যাকেট',
  'বোতল',
  'ডজন',
  'অন্যান্য',
];

export const SavedMemosView: React.FC<SavedMemosViewProps> = ({
  savedMemos,
  onUpdateMemo,
  onDeleteMemo,
  onDuplicateMemo,
  onLoadIntoActive,
  onOpenShareModal,
  settings,
}) => {
  const isBn = settings.numberFormat === 'bn';
  const [filter, setFilter] = useState<'all' | 'market' | 'medicine'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active modal states
  const [activeMemo, setActiveMemo] = useState<SavedMemo | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [deletingMemo, setDeletingMemo] = useState<SavedMemo | null>(null);

  // Filter and search
  const filteredMemos = savedMemos.filter((memo) => {
    if (filter === 'market' && memo.type !== 'market') return false;
    if (filter === 'medicine' && !memo.type.startsWith('medicine')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = memo.title.toLowerCase().includes(q);
      const matchMarket = memo.marketItems?.some((i) => i.name.toLowerCase().includes(q));
      const matchMed = memo.medicineItems?.some((i) => i.name.toLowerCase().includes(q));
      const matchReq = memo.requiredMedicineItems?.some((i) => i.name.toLowerCase().includes(q));
      return matchTitle || matchMarket || matchMed || matchReq;
    }
    return true;
  });

  const handleDuplicate = (memo: SavedMemo) => {
    const duplicated: SavedMemo = {
      ...memo,
      id: `saved-dup-${Date.now()}`,
      title: `${memo.title} (কপি)`,
      date: getTodayFormatted(settings.dateFormat),
      time: getTimeFormatted(),
      timestamp: Date.now(),
    };
    onDuplicateMemo(duplicated);
  };

  // Helper to recalculate total for Market Memo
  const recalculateMarketTotal = (items: MarketItem[]): number => {
    return items.reduce((sum, item) => {
      return sum + (item.pricePerUnit ? item.quantity * item.pricePerUnit : 0);
    }, 0);
  };

  // Helper to recalculate total for Medicine Memo
  const recalculateMedicineTotal = (items: MedicineItem[]): number => {
    return items.reduce((sum, item) => {
      const calc = calculateMedicine(item, isBn);
      return sum + calc.estimatedCost;
    }, 0);
  };

  // Real-time Update Handler for Active Memo (Auto-saves to IndexedDB)
  const handleUpdateActiveMemo = (updated: SavedMemo) => {
    setActiveMemo(updated);
    onUpdateMemo(updated);
  };

  // Market Item Updates inside Saved Memo
  const handleUpdateMarketItem = (itemId: string, field: keyof MarketItem, value: any) => {
    if (!activeMemo || !activeMemo.marketItems) return;

    const newItems = activeMemo.marketItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });

    const newTotal = recalculateMarketTotal(newItems);
    const updated: SavedMemo = {
      ...activeMemo,
      marketItems: newItems,
      totalPrice: newTotal,
      itemCount: newItems.length,
    };
    handleUpdateActiveMemo(updated);
  };

  const handleAddMarketItemToSaved = () => {
    if (!activeMemo) return;
    const newItem: MarketItem = {
      id: `m-saved-${Date.now()}`,
      name: 'নতুন পণ্য',
      quantity: 1,
      unit: 'কেজি',
      pricePerUnit: null,
      isPurchased: false,
      createdAt: Date.now(),
    };
    const newItems = [...(activeMemo.marketItems || []), newItem];
    const newTotal = recalculateMarketTotal(newItems);
    const updated: SavedMemo = {
      ...activeMemo,
      marketItems: newItems,
      totalPrice: newTotal,
      itemCount: newItems.length,
    };
    handleUpdateActiveMemo(updated);
  };

  const handleDeleteMarketItemFromSaved = (itemId: string) => {
    if (!activeMemo || !activeMemo.marketItems) return;
    const newItems = activeMemo.marketItems.filter((i) => i.id !== itemId);
    const newTotal = recalculateMarketTotal(newItems);
    const updated: SavedMemo = {
      ...activeMemo,
      marketItems: newItems,
      totalPrice: newTotal,
      itemCount: newItems.length,
    };
    handleUpdateActiveMemo(updated);
  };

  // Medicine Item Updates inside Saved Memo
  const handleUpdateMedicineItem = (itemId: string, field: keyof MedicineItem, value: any) => {
    if (!activeMemo || !activeMemo.medicineItems) return;

    const newItems = activeMemo.medicineItems.map((item) => {
      if (item.id === itemId) {
        const mod = { ...item, [field]: value };
        if (field === 'finalPurchaseStrips' || field === 'finalPurchasePieces') {
          mod.isPurchaseOverridden = true;
        }
        return mod;
      }
      return item;
    });

    const newTotal = recalculateMedicineTotal(newItems);
    const updated: SavedMemo = {
      ...activeMemo,
      medicineItems: newItems,
      totalPrice: newTotal,
      itemCount: newItems.length,
    };
    handleUpdateActiveMemo(updated);
  };

  const handleAddMedicineItemToSaved = () => {
    if (!activeMemo) return;
    const newItem: MedicineItem = {
      id: `med-saved-${Date.now()}`,
      name: 'নতুন ঔষধ',
      stripSize: 10,
      currentStockStrips: 0,
      currentStockPieces: 0,
      calcMethod: 'monthly',
      dailyRequirement: 2,
      monthlyRequirementStrips: 1,
      monthlyRequirementPieces: 0,
      priceType: 'strip',
      unitPrice: null,
      finalPurchaseStrips: 1,
      finalPurchasePieces: 0,
      isPurchaseOverridden: true,
      createdAt: Date.now(),
    };
    const newItems = [...(activeMemo.medicineItems || []), newItem];
    const newTotal = recalculateMedicineTotal(newItems);
    const updated: SavedMemo = {
      ...activeMemo,
      medicineItems: newItems,
      totalPrice: newTotal,
      itemCount: newItems.length,
    };
    handleUpdateActiveMemo(updated);
  };

  const handleDeleteMedicineItemFromSaved = (itemId: string) => {
    if (!activeMemo || !activeMemo.medicineItems) return;
    const newItems = activeMemo.medicineItems.filter((i) => i.id !== itemId);
    const newTotal = recalculateMedicineTotal(newItems);
    const updated: SavedMemo = {
      ...activeMemo,
      medicineItems: newItems,
      totalPrice: newTotal,
      itemCount: newItems.length,
    };
    handleUpdateActiveMemo(updated);
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!deletingMemo) return;
    onDeleteMemo(deletingMemo.id);
    if (activeMemo?.id === deletingMemo.id) {
      setActiveMemo(null);
    }
    setDeletingMemo(null);
  };

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="মেমোর নাম বা পণ্যের নাম দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium focus:outline-hidden transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            সব মেমো ({formatNum(savedMemos.length, isBn)})
          </button>
          <button
            onClick={() => setFilter('market')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'market'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🛒 বাজার ({formatNum(savedMemos.filter((m) => m.type === 'market').length, isBn)})
          </button>
          <button
            onClick={() => setFilter('medicine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'medicine'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            💊 ঔষধ ({formatNum(savedMemos.filter((m) => m.type.startsWith('medicine')).length, isBn)})
          </button>
        </div>
      </div>

      {/* Memos List */}
      {filteredMemos.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <BookMarked className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">কোনো সংরক্ষিত মেমো পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery
              ? 'অনুসন্ধানের সাথে কোনো মেমো মেলেনি।'
              : 'বাজার বা ঔষধ সেকশন থেকে মেমো সংরক্ষণ করলে এখানে তালিকা হিসেবে জমা থাকবে।'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemos.map((memo) => {
            const isMarket = memo.type === 'market';

            return (
              <div
                key={memo.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs transition"
              >
                {/* Header: Title, Date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-xl shrink-0 mt-0.5">
                      {isMarket ? '🛒' : '💊'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                        {memo.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {memo.date}
                        </span>
                        {memo.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {memo.time}
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {formatNum(memo.itemCount, isBn)}টি আইটেম
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Price */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold block">মোট খরচ</span>
                    <strong className="text-sm font-extrabold text-slate-900">
                      {formatCurrency(memo.totalPrice, settings.currency, isBn)}
                    </strong>
                  </div>
                </div>

                {/* Items Preview Chips */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {isMarket &&
                    memo.marketItems?.slice(0, 4).map((item) => (
                      <span
                        key={item.id}
                        className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {item.name} ({formatNum(item.quantity, isBn)} {item.unit})
                      </span>
                    ))}

                  {!isMarket &&
                    (memo.medicineItems || memo.requiredMedicineItems)?.slice(0, 4).map((med) => (
                      <span
                        key={med.id}
                        className="text-[10px] font-medium bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-100"
                      >
                        {med.name}
                      </span>
                    ))}

                  {memo.itemCount > 4 && (
                    <span className="text-[10px] font-bold text-slate-400 self-center">
                      +{formatNum(memo.itemCount - 4, isBn)}টি আরো
                    </span>
                  )}
                </div>

                {/* Action Buttons: View, Edit, Duplicate, Share, Delete */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setActiveMemo(memo);
                        setIsEditingMode(false);
                      }}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>বিস্তারিত</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveMemo(memo);
                        setIsEditingMode(true);
                      }}
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition font-semibold"
                      title="এই সংরক্ষিত মেমোটি এডিট করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>সম্পাদনা</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(memo)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="কপি করুন"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenShareModal(memo)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="শেয়ার করুন"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingMemo(memo)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL SAVED MEMO VIEWER / IN-PLACE EDITOR MODAL */}
      {activeMemo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">
                    {activeMemo.type === 'market' ? '🛒' : '💊'}
                  </span>
                  {isEditingMode ? (
                    <input
                      type="text"
                      value={activeMemo.title}
                      onChange={(e) =>
                        handleUpdateActiveMemo({ ...activeMemo, title: e.target.value })
                      }
                      className="font-bold text-slate-900 text-sm bg-white border border-slate-300 rounded-lg px-2 py-1 w-full focus:outline-hidden focus:border-emerald-600"
                      placeholder="মেমোর শিরোনাম..."
                    />
                  ) : (
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {activeMemo.title}
                    </h3>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{activeMemo.date} {activeMemo.time && `(${activeMemo.time})`}</span>
                  {isEditingMode && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded-sm">
                      অটো-সেভ সক্রিয়
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsEditingMode(!isEditingMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    isEditingMode
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingMode ? 'সম্পাদনা মোড' : 'এডিট করুন'}</span>
                </button>
                <button
                  onClick={() => setActiveMemo(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Item List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {/* MARKET MEMO ITEMS */}
              {activeMemo.type === 'market' && (
                <div className="space-y-2.5">
                  {activeMemo.marketItems?.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition text-xs space-y-2 ${
                        item.isPurchased
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      {/* Row 1: Checkbox, Name, Price */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateMarketItem(item.id, 'isPurchased', !item.isPurchased)
                            }
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                              item.isPurchased
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 text-slate-400 hover:border-emerald-600'
                            }`}
                          >
                            {item.isPurchased ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                          </button>

                          {isEditingMode ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateMarketItem(item.id, 'name', e.target.value)
                              }
                              placeholder="পণ্যের নাম"
                              className="font-bold text-slate-900 border border-slate-300 rounded-lg px-2 py-1 flex-1 min-w-0 focus:outline-hidden focus:border-emerald-600"
                            />
                          ) : (
                            <span
                              className={`font-bold text-slate-900 truncate ${
                                item.isPurchased ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {idx + 1}. {item.name}
                            </span>
                          )}
                        </div>

                        {/* Price Display / Edit */}
                        <div className="text-right shrink-0">
                          {isEditingMode ? (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">৳</span>
                              <input
                                type="number"
                                min="0"
                                value={item.pricePerUnit !== null ? item.pricePerUnit : ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : null;
                                  handleUpdateMarketItem(item.id, 'pricePerUnit', val);
                                }}
                                placeholder="দর"
                                className="w-16 border border-slate-300 rounded-lg px-1.5 py-1 text-right font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                              />
                            </div>
                          ) : (
                            <strong className="text-emerald-700 font-extrabold">
                              {item.pricePerUnit
                                ? formatCurrency(item.quantity * item.pricePerUnit, settings.currency, isBn)
                                : '—'}
                            </strong>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Quantity, Unit, Note, Delete */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                        {isEditingMode ? (
                          <div className="flex items-center gap-1.5 flex-wrap flex-1">
                            <span className="text-slate-500">পরিমাণ:</span>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateMarketItem(item.id, 'quantity', parseFloat(e.target.value) || 1)
                              }
                              className="w-14 border border-slate-300 rounded-lg px-1.5 py-0.5 text-center font-bold text-slate-900 focus:outline-hidden"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateMarketItem(item.id, 'unit', e.target.value as MarketUnit)
                              }
                              className="border border-slate-300 rounded-lg px-1.5 py-0.5 bg-white text-slate-700 font-medium focus:outline-hidden"
                            >
                              {MARKET_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) =>
                                handleUpdateMarketItem(item.id, 'note', e.target.value)
                              }
                              placeholder="নোট (যেমন: ফ্রেশ)"
                              className="border border-slate-300 rounded-lg px-1.5 py-0.5 flex-1 min-w-[90px] text-slate-600 focus:outline-hidden"
                            />
                          </div>
                        ) : (
                          <div className="text-slate-500 flex items-center gap-2">
                            <span>
                              পরিমাণ: <strong className="text-slate-800">{formatNum(item.quantity, isBn)} {item.unit}</strong>
                            </span>
                            {item.note && <span>• {item.note}</span>}
                          </div>
                        )}

                        {isEditingMode && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMarketItemFromSaved(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                            title="আইটেম মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={handleAddMarketItemToSaved}
                      className="w-full py-2.5 border border-dashed border-emerald-500 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>পণ্য যোগ করুন</span>
                    </button>
                  )}
                </div>
              )}

              {/* MEDICINE MEMO ITEMS */}
              {activeMemo.type.startsWith('medicine') && (
                <div className="space-y-2.5">
                  {(activeMemo.medicineItems || []).map((med, idx) => {
                    const calc = calculateMedicine(med, isBn);
                    return (
                      <div
                        key={med.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs text-xs space-y-2"
                      >
                        {/* Row 1: Name, Price */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm">💊</span>
                            {isEditingMode ? (
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) =>
                                  handleUpdateMedicineItem(med.id, 'name', e.target.value)
                                }
                                placeholder="ঔষধের নাম"
                                className="font-bold text-slate-900 border border-slate-300 rounded-lg px-2 py-1 flex-1 min-w-0 focus:outline-hidden focus:border-sky-600"
                              />
                            ) : (
                              <strong className="text-slate-900 truncate">
                                {idx + 1}. {med.name}
                              </strong>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            {isEditingMode ? (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">৳</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={med.unitPrice !== null ? med.unitPrice : ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                    handleUpdateMedicineItem(med.id, 'unitPrice', val);
                                  }}
                                  placeholder="দর"
                                  className="w-16 border border-slate-300 rounded-lg px-1.5 py-1 text-right font-bold text-slate-900 focus:outline-hidden focus:border-sky-600"
                                />
                              </div>
                            ) : (
                              <strong className="text-sky-800 font-extrabold">
                                {calc.estimatedCost > 0
                                  ? formatCurrency(calc.estimatedCost, settings.currency, isBn)
                                  : '—'}
                              </strong>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Final Purchase Quantity & Stock Info */}
                        <div className="bg-slate-50 p-2 rounded-xl text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">কেনার পরিমাণ:</span>
                            {isEditingMode ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={med.finalPurchaseStrips}
                                  onChange={(e) =>
                                    handleUpdateMedicineItem(
                                      med.id,
                                      'finalPurchaseStrips',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-12 border border-slate-300 rounded-md px-1 py-0.5 text-center font-bold text-slate-900"
                                />
                                <span className="text-slate-500">পাতা</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={med.finalPurchasePieces}
                                  onChange={(e) =>
                                    handleUpdateMedicineItem(
                                      med.id,
                                      'finalPurchasePieces',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-12 border border-slate-300 rounded-md px-1 py-0.5 text-center font-bold text-slate-900"
                                />
                                <span className="text-slate-500">পিস</span>
                              </div>
                            ) : (
                              <strong className="text-rose-700">{calc.finalPurchaseLabelBn}</strong>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-slate-500 text-[10px]">
                            <span>বর্তমান স্টক: {calc.currentStockLabelBn}</span>
                            <span>১ পাতা = {formatNum(med.stripSize, isBn)} পিস</span>
                          </div>
                        </div>

                        {/* Row 3: Note & Delete */}
                        {isEditingMode && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <input
                              type="text"
                              value={med.note || ''}
                              onChange={(e) =>
                                handleUpdateMedicineItem(med.id, 'note', e.target.value)
                              }
                              placeholder="নোট (ঐচ্ছিক)"
                              className="border border-slate-300 rounded-lg px-2 py-0.5 text-[11px] flex-1 text-slate-600 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteMedicineItemFromSaved(med.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                              title="ঔষধ মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={handleAddMedicineItemToSaved}
                      className="w-full py-2.5 border border-dashed border-sky-500 text-sky-700 bg-sky-50/50 hover:bg-sky-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ঔষধ যোগ করুন</span>
                    </button>
                  )}
                </div>
              )}

              {/* Total Row */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-extrabold text-sm text-slate-900">
                <span>সর্বমোট আনুমানিক খরচ:</span>
                <span className="text-emerald-700">
                  {formatCurrency(activeMemo.totalPrice, settings.currency, isBn)}
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setDeletingMemo(activeMemo)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                title="মেমোটি মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>মুছুন</span>
              </button>

              <div className="flex items-center gap-2 flex-1 justify-end">
                <button
                  onClick={() => {
                    onOpenShareModal(activeMemo);
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>শেয়ার</span>
                </button>

                <button
                  onClick={() => {
                    onLoadIntoActive(activeMemo);
                    setActiveMemo(null);
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  title="সক্রিয় তালিকায় লোড করুন"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>সক্রিয় হিসেবে খুলুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (Requirement 1) */}
      {deletingMemo && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                আপনি কি এই মেমোটি মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                "{deletingMemo.title}" মেমোটি স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMemo(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                ❌ বাতিল
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                🗑️ মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
