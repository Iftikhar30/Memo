export type MarketUnit = 
  | 'কেজি'
  | 'গ্রাম'
  | 'লিটার'
  | 'মিলিলিটার'
  | 'পিস'
  | 'প্যাকেট'
  | 'বোতল'
  | 'ডজন'
  | 'অন্যান্য';

export interface MarketItem {
  id: string;
  name: string;
  quantity: number;
  unit: MarketUnit;
  pricePerUnit: number | null; // Price per unit (e.g. ৳ per kg)
  note?: string;
  isPurchased: boolean;
  createdAt: number;
}

export type MedicineCalcMethod = 'daily' | 'monthly';
export type MedicinePriceType = 'strip' | 'piece' | 'none';

export interface MedicineItem {
  id: string;
  name: string;
  stripSize: number; // e.g. 10 (1 পাতায় = 10 পিস)
  currentStockStrips: number;
  currentStockPieces: number;
  calcMethod: MedicineCalcMethod;
  dailyRequirement: number; // Daily pieces usage, e.g. 2
  monthlyRequirementStrips: number;
  monthlyRequirementPieces: number;
  priceType: MedicinePriceType;
  unitPrice: number | null; // Price per strip or per piece
  note?: string;
  // Final purchase quantity manually editable by user
  finalPurchaseStrips: number;
  finalPurchasePieces: number;
  isPurchaseOverridden: boolean; // Flag if user manually changed final purchase
  createdAt: number;
}

// Simple direct requirement medicine item (Mode B)
export interface RequiredMedicineItem {
  id: string;
  name: string;
  strips: number;
  pieces: number;
  unitPrice?: number | null;
  priceType?: MedicinePriceType;
  note?: string;
  createdAt: number;
}

export type MemoType = 'market' | 'medicine_full' | 'medicine_required';

export interface SavedMemo {
  id: string;
  title: string;
  type: MemoType;
  date: string; // Formatted date e.g. "05 September 2026"
  time: string; // Formatted time e.g. "02:30 PM"
  timestamp: number;
  marketItems?: MarketItem[];
  medicineItems?: MedicineItem[];
  requiredMedicineItems?: RequiredMedicineItem[];
  totalPrice: number;
  itemCount: number;
  note?: string;
}

export interface UserSettings {
  userName: string; // Default: "Iftikhar Ahmed"
  currency: string; // Default: "৳"
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD MMMM YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  defaultShareFormat: 'image' | 'pdf' | 'text';
  numberFormat: 'bn' | 'en'; // Bengali (১, ২, ৩) or English (1, 2, 3)
}

export type ActiveTab = 'home' | 'market' | 'medicine' | 'saved' | 'settings';

export interface ActiveMarketState {
  title: string;
  items: MarketItem[];
  updatedAt: number;
}

export interface ActiveMedicineState {
  title: string;
  mode: 'full' | 'required';
  items: MedicineItem[];
  requiredItems: RequiredMedicineItem[];
  updatedAt: number;
}

export interface MemoExportOptions {
  showPrice: boolean; // true = দামসহ, false = দাম ছাড়া
  medicineExportType?: 'full' | 'simple'; // 'full' = Full Memo, 'simple' = Simple Required Memo
}
