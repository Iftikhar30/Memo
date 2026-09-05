import { MedicineItem, RequiredMedicineItem } from '../types';
import { formatNum, formatCurrency } from './numberFormat';

export interface MedicineCalculationResult {
  stripSize: number;
  currentTotalPieces: number;
  monthlyTotalPieces: number;
  isShortage: boolean;
  shortagePieces: number;
  remainingPieces: number;
  autoRequiredStrips: number;
  autoRequiredPieces: number;
  finalPurchaseStrips: number;
  finalPurchasePieces: number;
  finalTotalPieces: number;
  estimatedCost: number;
  autoRequiredLabelBn: string;
  autoRequiredLabelEn: string;
  finalPurchaseLabelBn: string;
  finalPurchaseLabelEn: string;
  currentStockLabelBn: string;
  monthlyNeedLabelBn: string;
}

export function calculateMedicine(item: MedicineItem, useBengali = true): MedicineCalculationResult {
  const stripSize = Math.max(1, item.stripSize || 10);

  // 1. Current stock converted to total pieces
  const currentTotalPieces = Math.max(0, (item.currentStockStrips || 0) * stripSize + (item.currentStockPieces || 0));

  // 2. Monthly requirement in pieces
  let monthlyTotalPieces = 0;
  if (item.calcMethod === 'daily') {
    monthlyTotalPieces = Math.max(0, (item.dailyRequirement || 0) * 30);
  } else {
    monthlyTotalPieces = Math.max(0, (item.monthlyRequirementStrips || 0) * stripSize + (item.monthlyRequirementPieces || 0));
  }

  // 3. Shortage calculation
  const isShortage = currentTotalPieces < monthlyTotalPieces;
  const shortagePieces = isShortage ? monthlyTotalPieces - currentTotalPieces : 0;
  const remainingPieces = !isShortage ? currentTotalPieces - monthlyTotalPieces : 0;

  // 4. Auto required breakdown
  const autoRequiredStrips = Math.floor(shortagePieces / stripSize);
  const autoRequiredPieces = shortagePieces % stripSize;

  // 5. Final purchase quantities
  // If user hasn't customized or overridden, it matches auto calculation
  let finalPurchaseStrips = item.finalPurchaseStrips ?? autoRequiredStrips;
  let finalPurchasePieces = item.finalPurchasePieces ?? autoRequiredPieces;

  if (!item.isPurchaseOverridden) {
    finalPurchaseStrips = autoRequiredStrips;
    finalPurchasePieces = autoRequiredPieces;
  }

  const finalTotalPieces = Math.max(0, finalPurchaseStrips * stripSize + finalPurchasePieces);

  // 6. Cost calculation based on Final Purchase Quantity
  let estimatedCost = 0;
  if (item.unitPrice && item.unitPrice > 0 && item.priceType && item.priceType !== 'none') {
    if (item.priceType === 'strip') {
      // price per strip
      estimatedCost = finalPurchaseStrips * item.unitPrice + (finalPurchasePieces / stripSize) * item.unitPrice;
    } else if (item.priceType === 'piece') {
      // price per piece
      estimatedCost = finalTotalPieces * item.unitPrice;
    }
  }

  // Labels
  const formatQtyLabel = (strips: number, pieces: number, isBn: boolean) => {
    if (strips === 0 && pieces === 0) {
      return isBn ? 'প্রয়োজন নেই' : '0 needed';
    }
    const parts: string[] = [];
    if (strips > 0) {
      parts.push(`${formatNum(strips, isBn)} ${isBn ? 'পাতা' : 'strip' + (strips > 1 ? 's' : '')}`);
    }
    if (pieces > 0) {
      parts.push(`${formatNum(pieces, isBn)} ${isBn ? 'পিস' : 'piece' + (pieces > 1 ? 's' : '')}`);
    }
    return parts.join(' + ');
  };

  const autoRequiredLabelBn = isShortage
    ? formatQtyLabel(autoRequiredStrips, autoRequiredPieces, true)
    : 'পর্যাপ্ত আছে';

  const autoRequiredLabelEn = isShortage
    ? formatQtyLabel(autoRequiredStrips, autoRequiredPieces, false)
    : 'In Stock';

  const finalPurchaseLabelBn = formatQtyLabel(finalPurchaseStrips, finalPurchasePieces, true);
  const finalPurchaseLabelEn = formatQtyLabel(finalPurchaseStrips, finalPurchasePieces, false);

  const currentStockLabelBn = formatQtyLabel(item.currentStockStrips || 0, item.currentStockPieces || 0, true);
  
  let monthlyNeedLabelBn = '';
  if (item.calcMethod === 'daily') {
    monthlyNeedLabelBn = `দৈনিক ${formatNum(item.dailyRequirement, true)} পিস (মাসে ${formatNum(monthlyTotalPieces, true)} পিস)`;
  } else {
    monthlyNeedLabelBn = formatQtyLabel(item.monthlyRequirementStrips || 0, item.monthlyRequirementPieces || 0, true);
  }

  return {
    stripSize,
    currentTotalPieces,
    monthlyTotalPieces,
    isShortage,
    shortagePieces,
    remainingPieces,
    autoRequiredStrips,
    autoRequiredPieces,
    finalPurchaseStrips,
    finalPurchasePieces,
    finalTotalPieces,
    estimatedCost,
    autoRequiredLabelBn,
    autoRequiredLabelEn,
    finalPurchaseLabelBn,
    finalPurchaseLabelEn,
    currentStockLabelBn,
    monthlyNeedLabelBn,
  };
}

export function calculateRequiredMedicineCost(item: RequiredMedicineItem): number {
  if (!item.unitPrice || item.unitPrice <= 0 || !item.priceType || item.priceType === 'none') {
    return 0;
  }
  if (item.priceType === 'strip') {
    return item.strips * item.unitPrice;
  }
  // piece price
  return item.pieces * item.unitPrice;
}
