import { SavedMemo, UserSettings, MemoExportOptions } from '../types';
import { calculateMedicine } from '../utils/medicineCalc';
import { formatCurrency, formatNum } from '../utils/numberFormat';

export async function generateMemoImage(
  memo: SavedMemo,
  settings: UserSettings,
  format: 'image/jpeg' | 'image/png' = 'image/png',
  options?: MemoExportOptions
): Promise<{ blob: Blob; dataUrl: string }> {
  const width = 1080;
  const padding = 60;
  const isBn = settings.numberFormat === 'bn';

  const showPrice = options?.showPrice ?? true;
  const isMedicine = memo.type.startsWith('medicine');
  const medicineExportType = options?.medicineExportType || (memo.type === 'medicine_required' ? 'simple' : 'full');

  // Measure dynamic items
  const itemsCount =
    memo.type === 'market'
      ? (memo.marketItems?.length || 0)
      : (memo.medicineItems?.length || memo.requiredMedicineItems?.length || 0);

  const rowHeight = isMedicine && medicineExportType === 'full' ? 95 : 85;
  const headerHeight = 220;
  const tableHeaderAndPadding = 120;
  const summaryBoxHeight = showPrice ? 100 : 20;
  const calculatedCardHeight = tableHeaderAndPadding + Math.max(1, itemsCount) * rowHeight + summaryBoxHeight;
  const cardY = headerHeight + 30;
  const cardWidth = width - padding * 2;
  const height = cardY + calculatedCardHeight + 50; // Neat bottom padding without promotional text

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Top header gradient banner
  const primaryGrad = ctx.createLinearGradient(0, 0, width, 0);
  if (isMedicine) {
    primaryGrad.addColorStop(0, '#0284c7'); // sky / blue for medicine
    primaryGrad.addColorStop(1, '#0369a1');
  } else {
    primaryGrad.addColorStop(0, '#059669'); // emerald for market
    primaryGrad.addColorStop(1, '#047857');
  }

  ctx.fillStyle = primaryGrad;
  ctx.fillRect(0, 0, width, headerHeight);

  // Clean Memo Title (NO "MY MEMO", NO "লোকাল মেমো ম্যানেজার", NO extra promotional subtitles)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 44px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
  let defaultHeaderTitle = isMedicine ? '💊 ঔষধের মেমো' : '🛒 বাজারের মেমো';
  const displayTitle = memo.title ? memo.title : defaultHeaderTitle;
  ctx.fillText(displayTitle, padding, 72);

  // Date (Clean and visible)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = '600 25px -apple-system, "Segoe UI", Roboto, sans-serif';
  const dateStr = memo.date ? `${memo.date}${memo.time ? ` (${memo.time})` : ''}` : '';
  ctx.fillText(dateStr, padding, 125);

  // User Name (Clean directly underneath)
  ctx.fillStyle = '#fef08a'; // subtle soft yellow highlight for user name
  ctx.font = '700 28px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(settings.userName || 'Iftikhar Ahmed', padding, 175);

  // Content Container Card
  const cardHeight = calculatedCardHeight;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.roundRect(padding, cardY, cardWidth, cardHeight, 24);
  ctx.fill();
  ctx.restore();

  // Table Column Headers
  const tableHeaderY = cardY + 50;
  ctx.fillStyle = '#64748b';
  ctx.font = '700 24px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isMedicine ? 'ঔষধের নাম' : 'পণ্যের নাম', padding + 35, tableHeaderY);

  if (showPrice) {
    ctx.fillText('পরিমাণ', padding + cardWidth * 0.52, tableHeaderY);
    ctx.fillText('মূল্য', padding + cardWidth * 0.82, tableHeaderY);
  } else {
    // If no price, expand quantity column for comfortable spacing
    ctx.fillText('পরিমাণ', padding + cardWidth * 0.75, tableHeaderY);
  }

  // Divider under header
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding + 25, tableHeaderY + 20);
  ctx.lineTo(padding + cardWidth - 25, tableHeaderY + 20);
  ctx.stroke();

  // Render Rows
  let currentY = tableHeaderY + 65;

  if (memo.type === 'market' && memo.marketItems) {
    memo.marketItems.forEach((item, idx) => {
      // Row alternating highlight
      if (idx % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(padding + 20, currentY - 35, cardWidth - 40, rowHeight - 20);
      }

      // Purchased status icon
      ctx.fillStyle = item.isPurchased ? '#10b981' : '#94a3b8';
      ctx.font = '700 24px -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(item.isPurchased ? '✓' : '•', padding + 35, currentY);

      // Product Name
      ctx.fillStyle = item.isPurchased ? '#64748b' : '#0f172a';
      ctx.font = '600 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
      const name = item.name.length > 25 ? item.name.slice(0, 23) + '...' : item.name;
      ctx.fillText(name, padding + 65, currentY);

      if (item.note) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 20px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
        ctx.fillText(item.note, padding + 65, currentY + 24);
      }

      // Quantity + Unit
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
      const qtyStr = `${formatNum(item.quantity, isBn)} ${item.unit}`;
      const qtyX = showPrice ? padding + cardWidth * 0.52 : padding + cardWidth * 0.75;
      ctx.fillText(qtyStr, qtyX, currentY);

      // Price (only if showPrice is true)
      if (showPrice) {
        const itemPrice = item.pricePerUnit ? item.quantity * item.pricePerUnit : null;
        ctx.fillStyle = itemPrice ? '#059669' : '#94a3b8';
        ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
        const priceStr = itemPrice !== null ? formatCurrency(itemPrice, settings.currency, isBn) : '—';
        ctx.fillText(priceStr, padding + cardWidth * 0.82, currentY);
      }

      currentY += rowHeight;
    });
  } else if (isMedicine) {
    // Either from medicineItems or requiredMedicineItems
    const items = memo.medicineItems || [];
    if (items.length > 0) {
      items.forEach((med, idx) => {
        const calc = calculateMedicine(med, isBn);

        if (idx % 2 === 1) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(padding + 20, currentY - 35, cardWidth - 40, rowHeight - 20);
        }

        // Pill bullet
        ctx.fillStyle = '#0284c7';
        ctx.font = '700 24px -apple-system, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('💊', padding + 35, currentY);

        // Medicine Name
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
        const name = med.name.length > 25 ? med.name.slice(0, 23) + '...' : med.name;
        ctx.fillText(name, padding + 70, currentY);

        // Subtitle (only in Full Memo mode, hidden in Simple mode)
        if (medicineExportType === 'full') {
          ctx.fillStyle = '#64748b';
          ctx.font = '400 20px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
          ctx.fillText(
            `(১ পাতা = ${formatNum(med.stripSize, isBn)} পিস | বর্তমান স্টক: ${calc.currentStockLabelBn} | প্রয়োজন: ${calc.monthlyNeedLabelBn})`,
            padding + 70,
            currentY + 24
          );
        }

        // Final Purchase Quantity
        ctx.fillStyle = '#b91c1c'; // vibrant red for quantity to buy
        ctx.font = '700 25px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
        const qtyX = showPrice ? padding + cardWidth * 0.52 : padding + cardWidth * 0.75;
        ctx.fillText(calc.finalPurchaseLabelBn, qtyX, currentY);

        // Cost (only if showPrice is true)
        if (showPrice) {
          ctx.fillStyle = calc.estimatedCost > 0 ? '#0284c7' : '#94a3b8';
          ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
          const costStr = calc.estimatedCost > 0 ? formatCurrency(calc.estimatedCost, settings.currency, isBn) : '—';
          ctx.fillText(costStr, padding + cardWidth * 0.82, currentY);
        }

        currentY += rowHeight;
      });
    } else if (memo.requiredMedicineItems && memo.requiredMedicineItems.length > 0) {
      memo.requiredMedicineItems.forEach((med, idx) => {
        if (idx % 2 === 1) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(padding + 20, currentY - 35, cardWidth - 40, rowHeight - 20);
        }

        ctx.fillStyle = '#0284c7';
        ctx.font = '700 24px -apple-system, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('💊', padding + 35, currentY);

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
        ctx.fillText(med.name, padding + 70, currentY);

        // Quantity
        const parts: string[] = [];
        if (med.strips > 0) parts.push(`${formatNum(med.strips, isBn)} পাতা`);
        if (med.pieces > 0) parts.push(`${formatNum(med.pieces, isBn)} পিস`);
        const qtyStr = parts.length > 0 ? parts.join(' + ') : '০';

        ctx.fillStyle = '#b91c1c';
        ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
        const qtyX = showPrice ? padding + cardWidth * 0.52 : padding + cardWidth * 0.75;
        ctx.fillText(qtyStr, qtyX, currentY);

        // Price (only if showPrice is true)
        if (showPrice) {
          const cost =
            med.unitPrice && med.unitPrice > 0
              ? med.priceType === 'strip'
                ? med.strips * med.unitPrice
                : med.pieces * med.unitPrice
              : null;

          ctx.fillStyle = cost ? '#0284c7' : '#94a3b8';
          ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
          ctx.fillText(cost !== null ? formatCurrency(cost, settings.currency, isBn) : '—', padding + cardWidth * 0.82, currentY);
        }

        currentY += rowHeight;
      });
    }
  }

  // Summary Row at bottom of inner card (ONLY IF showPrice is true)
  if (showPrice) {
    const summaryY = cardY + cardHeight - 85;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(padding + 20, summaryY, cardWidth - 40, 65);

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 26px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
    ctx.fillText('সর্বমোট আনুমানিক খরচ:', padding + 45, summaryY + 42);

    ctx.fillStyle = isMedicine ? '#0284c7' : '#059669';
    ctx.font = '800 32px -apple-system, "Hind Siliguri", "Segoe UI", Roboto, sans-serif';
    const totalStr = formatCurrency(memo.totalPrice || 0, settings.currency, isBn);
    ctx.fillText(totalStr, padding + cardWidth - 250, summaryY + 44);
  }

  // NO promotional/tagline text in footer (Requirement 4)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas blob export failed'));
          return;
        }
        const dataUrl = canvas.toDataURL(format, 0.95);
        resolve({ blob, dataUrl });
      },
      format,
      0.95
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
