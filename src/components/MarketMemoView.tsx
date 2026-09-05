import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  Share2,
  Save,
  Check,
  ShoppingBag,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { MarketItem, MarketUnit, ActiveMarketState, SavedMemo, UserSettings } from '../types';
import { formatCurrency, formatNum, getTodayFormatted, getTimeFormatted } from '../utils/numberFormat';

interface MarketMemoViewProps {
  marketState: ActiveMarketState;
  onUpdateState: (newState: ActiveMarketState) => void;
  onSaveAsMemo: (memo: SavedMemo) => void;
  onOpenShareModal: (memo: SavedMemo) => void;
  settings: UserSettings;
  isAddModalOpenInitially?: boolean;
}

export const MarketMemoView: React.FC<MarketMemoViewProps> = ({
  marketState,
  onUpdateState,
  onSaveAsMemo,
  onOpenShareModal,
  settings,
  isAddModalOpenInitially = false,
}) => {
  const isBn = settings.numberFormat === 'bn';
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState<number>(1);
  const [formUnit, setFormUnit] = useState<MarketUnit>('কেজি');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  const UNITS: MarketUnit[] = [
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

  // Calculations
  const totalItemsCount = marketState.items.length;
  const purchasedCount = marketState.items.filter((i) => i.isPurchased).length;
  const pendingCount = totalItemsCount - purchasedCount;

  const totalEstimatedCost = marketState.items.reduce((sum, item) => {
    return sum + (item.pricePerUnit ? item.quantity * item.pricePerUnit : 0);
  }, 0);

  const purchasedCost = marketState.items.reduce((sum, item) => {
    return item.isPurchased ? sum + (item.pricePerUnit ? item.quantity * item.pricePerUnit : 0) : sum;
  }, 0);

  const pendingCost = totalEstimatedCost - purchasedCost;

  // Handlers
  const handleTitleChange = (newTitle: string) => {
    onUpdateState({
      ...marketState,
      title: newTitle,
    });
  };

  const handleTogglePurchased = (id: string) => {
    const updated = marketState.items.map((item) =>
      item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
    );
    onUpdateState({ ...marketState, items: updated });
  };

  const handleQuantityStep = (id: string, delta: number) => {
    const updated = marketState.items.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(0.1, Number((item.quantity + delta).toFixed(2)));
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onUpdateState({ ...marketState, items: updated });
  };

  const handleDeleteItem = (id: string) => {
    const updated = marketState.items.filter((item) => item.id !== id);
    onUpdateState({ ...marketState, items: updated });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...marketState.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    onUpdateState({ ...marketState, items: newItems });
  };

  const handleClearPurchased = () => {
    if (purchasedCount === 0) return;
    if (window.confirm('কেনা পণ্যগুলো কি তালিকা থেকে মুছে ফেলতে চান?')) {
      const updated = marketState.items.filter((item) => !item.isPurchased);
      onUpdateState({ ...marketState, items: updated });
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormQty(1);
    setFormUnit('কেজি');
    setFormPrice('');
    setFormNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MarketItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormQty(item.quantity);
    setFormUnit(item.unit);
    setFormPrice(item.pricePerUnit ? String(item.pricePerUnit) : '');
    setFormNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedPrice = formPrice.trim() ? parseFloat(formPrice) : null;
    const cleanPrice = parsedPrice && !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;

    if (editingItem) {
      // Edit existing
      const updated = marketState.items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formName.trim(),
              quantity: formQty,
              unit: formUnit,
              pricePerUnit: cleanPrice,
              note: formNote.trim() || undefined,
            }
          : item
      );
      onUpdateState({ ...marketState, items: updated });
    } else {
      // Add new
      const newItem: MarketItem = {
        id: `m-${Date.now()}`,
        name: formName.trim(),
        quantity: formQty,
        unit: formUnit,
        pricePerUnit: cleanPrice,
        note: formNote.trim() || undefined,
        isPurchased: false,
        createdAt: Date.now(),
      };
      onUpdateState({
        ...marketState,
        items: [newItem, ...marketState.items],
      });
    }

    setIsModalOpen(false);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert current active market to a SavedMemo object
  const createCurrentMemoSnapshot = (): SavedMemo => {
    return {
      id: `saved-market-${Date.now()}`,
      title: marketState.title || 'বাজারের মেমো',
      type: 'market',
      date: getTodayFormatted(settings.dateFormat),
      time: getTimeFormatted(),
      timestamp: Date.now(),
      marketItems: [...marketState.items],
      totalPrice: totalEstimatedCost,
      itemCount: totalItemsCount,
    };
  };

  const handleSaveToPermanentMemos = () => {
    if (marketState.items.length === 0) {
      showToast('কোনো পণ্য তালিকায় নেই!');
      return;
    }
    const memo = createCurrentMemoSnapshot();
    onSaveAsMemo(memo);
    // Requirement 6: Clear active market list once finalized so items don't remain pending
    onUpdateState({
      ...marketState,
      items: [],
      updatedAt: Date.now(),
    });
    showToast('মেমো সংরক্ষিত হয়েছে এবং সক্রিয় তালিকা পরবর্তী বাজারের জন্য প্রস্তুত করা হয়েছে!');
  };

  const handleShareCurrent = () => {
    const memo = createCurrentMemoSnapshot();
    onOpenShareModal(memo);
  };

  // Filtered list
  const filteredItems = marketState.items.filter((item) => {
    if (filter === 'pending') return !item.isPurchased;
    if (filter === 'purchased') return item.isPurchased;
    return true;
  });

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* Memo Title Bar (Editable with Auto-Save) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          মেমো শিরোনাম (অটো-সেভ হবে)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={marketState.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="বাজারের মেমোর নাম দিন..."
            className="w-full text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-hidden py-1 px-0 transition bg-transparent"
          />
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-slate-500">মোট পণ্য</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">
            {formatNum(totalItemsCount, isBn)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-amber-700">বাকি আছে</span>
          <div className="text-lg font-extrabold text-amber-700 mt-0.5">
            {formatNum(pendingCount, isBn)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-emerald-700">কেনা হয়েছে</span>
          <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
            {formatNum(purchasedCount, isBn)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs text-center">
          <span className="text-[11px] font-semibold text-slate-600">মোট আনুমানিক</span>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">
            {formatCurrency(totalEstimatedCost, settings.currency, isBn)}
          </div>
        </div>
      </div>

      {/* Primary Action Row: Add Item + Save as Memo + Share */}
      <div className="flex items-center gap-2">
        <button
          onClick={openAddModal}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-sm active:scale-98 transition text-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>পণ্য যোগ করুন</span>
        </button>

        <button
          onClick={handleSaveToPermanentMemos}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-3 rounded-2xl active:scale-98 transition text-xs border border-slate-200"
          title="স্থায়ী মেমো হিসেবে সেভ করুন"
        >
          <Save className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline">সংরক্ষণ</span>
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

      {/* Filter Tabs & Clear Purchased Option */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            সব ({formatNum(totalItemsCount, isBn)})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            বাকি ({formatNum(pendingCount, isBn)})
          </button>
          <button
            onClick={() => setFilter('purchased')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filter === 'purchased' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            কেনা ({formatNum(purchasedCount, isBn)})
          </button>
        </div>

        {purchasedCount > 0 && (
          <button
            onClick={handleClearPurchased}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
          >
            কেনা পণ্য পরিষ্কার
          </button>
        )}
      </div>

      {/* Product List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">কোনো পণ্য নেই</h4>
          <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
            {filter === 'all'
              ? 'আপনার বাজারের ফর্দ তৈরি করতে উপরের "পণ্য যোগ করুন" বাটনে চাপুন।'
              : filter === 'pending'
              ? 'সব পণ্য কেনা হয়ে গেছে!'
              : 'এখনো কোনো পণ্য কেনা হয়নি।'}
          </p>
          {filter === 'all' && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>প্রথম পণ্য যোগ করুন</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item, index) => {
            const itemPrice = item.pricePerUnit ? item.quantity * item.pricePerUnit : null;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all ${
                  item.isPurchased
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Purchased Checkbox + Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleTogglePurchased(item.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition shrink-0"
                      title={item.isPurchased ? 'কেনা হয়নি চিহ্নিত করুন' : 'কেনা হয়েছে চিহ্নিত করুন'}
                    >
                      {item.isPurchased ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold leading-tight truncate ${
                            item.isPurchased ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                          {item.note}
                        </p>
                      )}

                      {/* Quantity & Unit Price */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {formatNum(item.quantity, isBn)} {item.unit}
                        </span>

                        {item.pricePerUnit && (
                          <span className="text-[11px] text-slate-500">
                            (দর: {formatCurrency(item.pricePerUnit, settings.currency, isBn)}/{item.unit})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Price & Action Menu */}
                  <div className="text-right shrink-0">
                    {itemPrice !== null ? (
                      <div className="text-sm font-extrabold text-emerald-700">
                        {formatCurrency(itemPrice, settings.currency, isBn)}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium">দর নেই</div>
                    )}

                    {/* Quick Stepper for Fast In-Store Shopping */}
                    <div className="flex items-center gap-1 mt-1.5 justify-end">
                      <button
                        onClick={() => handleQuantityStep(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs active:scale-95"
                        title="১ কমান"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleQuantityStep(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs active:scale-95"
                        title="১ বাড়ান"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Reorder, Edit, Delete */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-slate-700 disabled:opacity-30 transition"
                      title="উপরে নিন"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === marketState.items.length - 1}
                      className="p-1 hover:text-slate-700 disabled:opacity-30 transition"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Item Bottom Sheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'পণ্য সম্পাদনা' : 'নতুন বাজার পণ্য যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পণ্যের নাম <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: মিনিকেট চাল, মসুর ডাল, ডিম..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium focus:outline-hidden"
                  autoFocus
                />
              </div>

              {/* Quantity and Unit in 2-columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পরিমাণ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    একক (Unit) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as MarketUnit)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium bg-white focus:outline-hidden"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price per unit (optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  একক প্রতি মূল্য ({settings.currency}) <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="যেমন: ৭০ (প্রতি কেজির দর)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium focus:outline-hidden"
                />
                {formPrice && !isNaN(parseFloat(formPrice)) && (
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    আনুমানিক মোট:{' '}
                    {formatCurrency(formQty * parseFloat(formPrice), settings.currency, isBn)}
                  </div>
                )}
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোট / বিবরণ <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="যেমন: ভালো মানেরটা, প্যাকেট সিল করা..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm font-medium focus:outline-hidden"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-98 transition"
                >
                  {editingItem ? 'আপডেট করুন' : 'তালিকায় যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
