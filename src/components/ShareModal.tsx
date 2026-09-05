import React, { useState } from 'react';
import {
  Share2,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Download,
  Copy,
  Check,
  RefreshCw,
  Coins,
  EyeOff,
  ListFilter,
  FileSpreadsheet,
} from 'lucide-react';
import { SavedMemo, UserSettings, MemoExportOptions } from '../types';
import { shareMemo, formatMemoAsText } from '../services/shareService';
import { generateMemoImage, downloadBlob } from '../services/imageExport';
import { generateMemoPDF, downloadPDF } from '../services/pdfExport';
import { formatCurrency, formatNum } from '../utils/numberFormat';

interface ShareModalProps {
  memo: SavedMemo | null;
  settings: UserSettings;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ memo, settings, onClose }) => {
  if (!memo) return null;

  const isBn = settings.numberFormat === 'bn';
  const isMedicine = memo.type.startsWith('medicine');

  // Step 1: Medicine Mode Selection (Full vs Simple)
  const [medicineExportType, setMedicineExportType] = useState<'full' | 'simple'>(
    memo.type === 'medicine_required' ? 'simple' : 'full'
  );

  // Step 2: Show Price Option (With Price vs Without Price)
  const [showPrice, setShowPrice] = useState<boolean>(true);

  // Step 3: Format Selection
  const [activeFormat, setActiveFormat] = useState<'image' | 'pdf' | 'text'>(
    settings.defaultShareFormat || 'image'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const exportOptions: MemoExportOptions = {
    showPrice,
    medicineExportType,
  };

  const handleShare = async () => {
    setIsProcessing(true);
    setStatusMessage('প্রসেস করা হচ্ছে...');
    try {
      const res = await shareMemo(memo, settings, activeFormat, exportOptions);
      setStatusMessage(res.message);
      setTimeout(() => {
        if (res.success) setStatusMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('শেয়ার করতে ব্যর্থ হয়েছে');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDirectly = async () => {
    setIsProcessing(true);
    try {
      const cleanTitle = (memo.title || 'memo').replace(/\s+/g, '_');
      if (activeFormat === 'image') {
        const { blob } = await generateMemoImage(memo, settings, 'image/png', exportOptions);
        downloadBlob(blob, `${cleanTitle}_${Date.now()}.png`);
        setStatusMessage('ছবি ডাউনলোড হয়েছে!');
      } else if (activeFormat === 'pdf') {
        const { blob, filename } = await generateMemoPDF(memo, settings, exportOptions);
        downloadPDF(blob, filename);
        setStatusMessage('PDF ডাউনলোড হয়েছে!');
      } else {
        const text = formatMemoAsText(memo, settings, exportOptions);
        await navigator.clipboard.writeText(text);
        setCopiedText(true);
        setStatusMessage('ক্লিপবোর্ডে কপি করা হয়েছে!');
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('ডাউনলোড করতে সমস্যা হয়েছে');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCopyTextOnly = async () => {
    const text = formatMemoAsText(memo, settings, exportOptions);
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    setStatusMessage('মেমোর টেক্সট কপি হয়েছে!');
    setTimeout(() => {
      setCopiedText(false);
      setStatusMessage(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                মেমো শেয়ার ও এক্সপোর্ট
              </h3>
              <p className="text-[11px] text-slate-500">
                প্রয়োজনীয় অপশন নির্বাচন করে শেয়ার করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Memo Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="truncate max-w-[220px]">{memo.title}</span>
              {showPrice ? (
                <span className="text-emerald-700 font-extrabold text-sm">
                  {formatCurrency(memo.totalPrice, settings.currency, isBn)}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">
                  দাম ছাড়া
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>তারিখ: {memo.date} {memo.time && `(${memo.time})`}</span>
              <span>নাম: <strong className="text-slate-700">{settings.userName || 'Iftikhar Ahmed'}</strong></span>
            </div>
          </div>

          {/* STEP 1: Medicine Memo Type Selection (ONLY for Medicine Memos) */}
          {isMedicine && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-extrabold flex items-center justify-center">
                  ১
                </span>
                <label className="text-xs font-bold text-slate-800">
                  মেমোর ধরন নির্বাচন করুন:
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMedicineExportType('full')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    medicineExportType === 'full'
                      ? 'bg-sky-50 border-sky-600 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
                    <strong className="text-xs font-bold">📋 Full Memo</strong>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    স্টক, মাসিক প্রয়োজন ও কেনার হিসাবসহ
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMedicineExportType('simple')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    medicineExportType === 'simple'
                      ? 'bg-sky-50 border-sky-600 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <ListFilter className="w-4 h-4 text-sky-600 shrink-0" />
                    <strong className="text-xs font-bold">📝 Simple Required</strong>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    শুধু ঔষধের নাম ও প্রয়োজনীয় পরিমাণ
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Price Visibility Selection (Requirement 2) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold flex items-center justify-center">
                {isMedicine ? '২' : '১'}
              </span>
              <label className="text-xs font-bold text-slate-800">
                মেমোতে দাম দেখাবেন?
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowPrice(true)}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                  showPrice
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins className="w-5 h-5 text-emerald-600 mb-1" />
                <strong className="text-xs font-bold">💰 দামসহ</strong>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  প্রতি পণ্যের দাম ও মোট হিসাব থাকবে
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrice(false)}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition ${
                  !showPrice
                    ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <EyeOff className="w-5 h-5 text-amber-600 mb-1" />
                <strong className="text-xs font-bold">🚫 দাম ছাড়া</strong>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  দাম ও মোট মূল্য সম্পূর্ণ গোপন থাকবে
                </span>
              </button>
            </div>
          </div>

          {/* STEP 3: Export Format Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-extrabold flex items-center justify-center">
                {isMedicine ? '৩' : '২'}
              </span>
              <label className="text-xs font-bold text-slate-800">
                ফরম্যাট নির্বাচন করুন:
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Image Option */}
              <button
                type="button"
                onClick={() => setActiveFormat('image')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition text-center ${
                  activeFormat === 'image'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-5 h-5 mb-1 text-emerald-600" />
                <strong className="text-xs font-bold block">ছবি (JPG)</strong>
                <span className="text-[9px] text-slate-400">WhatsApp এর সেরা</span>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => setActiveFormat('pdf')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition text-center ${
                  activeFormat === 'pdf'
                    ? 'bg-sky-50 border-sky-600 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5 mb-1 text-sky-600" />
                <strong className="text-xs font-bold block">PDF মেমো</strong>
                <span className="text-[9px] text-slate-400">প্রিন্ট ও ফাইল</span>
              </button>

              {/* Text Option */}
              <button
                type="button"
                onClick={() => setActiveFormat('text')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition text-center ${
                  activeFormat === 'text'
                    ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-5 h-5 mb-1 text-purple-600" />
                <strong className="text-xs font-bold block">টেক্সট</strong>
                <span className="text-[9px] text-slate-400">মেসেজ আকারে</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-fade-in">
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons in Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
          <button
            onClick={handleShare}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm active:scale-98 transition disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>
              {activeFormat === 'text'
                ? 'সরাসরি শেয়ার বা কপি করুন'
                : 'শেয়ার করুন (WhatsApp / Android Share)'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadDirectly}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-98 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>ডিভাইসে ডাউনলোড</span>
            </button>

            <button
              onClick={handleCopyTextOnly}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-98 transition"
            >
              {copiedText ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>টেক্সট কপি</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
