import React, { useEffect, useState } from 'react';
import {
  ActiveTab,
  ActiveMarketState,
  ActiveMedicineState,
  SavedMemo,
  UserSettings,
} from './types';
import {
  getActiveMarketState,
  saveActiveMarketState,
  getActiveMedicineState,
  saveActiveMedicineState,
  getAllSavedMemos,
  saveMemo,
  deleteMemoById,
  getUserSettings,
  saveUserSettings,
} from './services/db';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { MarketMemoView } from './components/MarketMemoView';
import { MedicineMemoView } from './components/MedicineMemoView';
import { SavedMemosView } from './components/SavedMemosView';
import { SettingsView } from './components/SettingsView';
import { ShareModal } from './components/ShareModal';
import { calculateMedicine } from './utils/medicineCalc';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [settings, setSettings] = useState<UserSettings>({
    userName: 'Iftikhar Ahmed',
    currency: '৳',
    theme: 'light',
    numberFormat: 'bn',
    dateFormat: 'DD MMMM YYYY',
    defaultShareFormat: 'image',
  });

  const [marketState, setMarketState] = useState<ActiveMarketState>({
    title: 'বাজারের মেমো',
    items: [],
    updatedAt: Date.now(),
  });

  const [medicineState, setMedicineState] = useState<ActiveMedicineState>({
    title: 'ঔষধের মেমো',
    mode: 'full',
    items: [],
    requiredItems: [],
    updatedAt: Date.now(),
  });

  const [savedMemos, setSavedMemos] = useState<SavedMemo[]>([]);

  // Modals
  const [sharingMemo, setSharingMemo] = useState<SavedMemo | null>(null);
  const [autoOpenMarketAdd, setAutoOpenMarketAdd] = useState(false);
  const [autoOpenMedicineAdd, setAutoOpenMedicineAdd] = useState(false);

  // Load initial data from IndexedDB
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [savedSettings, initialMarket, initialMedicine, initialMemos] = await Promise.all([
        getUserSettings(),
        getActiveMarketState(),
        getActiveMedicineState(),
        getAllSavedMemos(),
      ]);

      setSettings(savedSettings);
      setMarketState(initialMarket);
      setMedicineState(initialMedicine);
      setSavedMemos(initialMemos);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handlers for state updates with Auto-Save
  const handleUpdateMarketState = (newState: ActiveMarketState) => {
    setMarketState(newState);
    saveActiveMarketState(newState).catch(console.error);
  };

  const handleUpdateMedicineState = (newState: ActiveMedicineState) => {
    setMedicineState(newState);
    saveActiveMedicineState(newState).catch(console.error);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings).catch(console.error);
  };

  const handleSaveAsMemo = async (memo: SavedMemo) => {
    await saveMemo(memo);
    const updated = await getAllSavedMemos();
    setSavedMemos(updated);
  };

  const handleDeleteMemo = async (id: string) => {
    await deleteMemoById(id);
    const updated = await getAllSavedMemos();
    setSavedMemos(updated);
  };

  const handleDuplicateMemo = async (memo: SavedMemo) => {
    await saveMemo(memo);
    const updated = await getAllSavedMemos();
    setSavedMemos(updated);
  };

  // Load a saved memo into active editor
  const handleLoadIntoActive = (memo: SavedMemo) => {
    if (memo.type === 'market' && memo.marketItems) {
      const newActive: ActiveMarketState = {
        title: memo.title,
        items: [...memo.marketItems],
        updatedAt: Date.now(),
      };
      handleUpdateMarketState(newActive);
      setActiveTab('market');
    } else if (memo.type.startsWith('medicine')) {
      const newActive: ActiveMedicineState = {
        title: memo.title,
        mode: memo.type === 'medicine_full' ? 'full' : 'required',
        items: memo.medicineItems ? [...memo.medicineItems] : [],
        requiredItems: memo.requiredMedicineItems ? [...memo.requiredMedicineItems] : [],
        updatedAt: Date.now(),
      };
      handleUpdateMedicineState(newActive);
      setActiveTab('medicine');
    }
  };

  // Count calculations for bottom navigation badges
  const isBn = settings.numberFormat === 'bn';
  const marketPendingCount = marketState.items.filter((i) => !i.isPurchased).length;
  let medicineNeededCount = 0;
  medicineState.items.forEach((item) => {
    const calc = calculateMedicine(item, isBn);
    if (calc.isShortage || calc.finalTotalPieces > 0) medicineNeededCount += 1;
  });
  if (medicineState.items.length === 0 && medicineState.requiredItems?.length > 0) {
    medicineNeededCount = medicineState.requiredItems.length;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans selection:bg-emerald-200">
      {/* Top Header */}
      <Header />

      {/* Main Content Area (Mobile Container max-w-md mx-auto) */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 pt-3 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">লোকাল ডাটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeDashboard
                onNavigate={(tab) => {
                  setAutoOpenMarketAdd(false);
                  setAutoOpenMedicineAdd(false);
                  setActiveTab(tab);
                }}
                marketState={marketState}
                medicineState={medicineState}
                savedMemos={savedMemos}
                settings={settings}
                onOpenShareModal={(memo) => setSharingMemo(memo)}
                onOpenAddMarketModal={() => {
                  setAutoOpenMarketAdd(true);
                  setActiveTab('market');
                }}
                onOpenAddMedicineModal={() => {
                  setAutoOpenMedicineAdd(true);
                  setActiveTab('medicine');
                }}
              />
            )}

            {activeTab === 'market' && (
              <MarketMemoView
                marketState={marketState}
                onUpdateState={handleUpdateMarketState}
                onSaveAsMemo={handleSaveAsMemo}
                onOpenShareModal={(memo) => setSharingMemo(memo)}
                settings={settings}
                isAddModalOpenInitially={autoOpenMarketAdd}
              />
            )}

            {activeTab === 'medicine' && (
              <MedicineMemoView
                medicineState={medicineState}
                onUpdateState={handleUpdateMedicineState}
                onSaveAsMemo={handleSaveAsMemo}
                onOpenShareModal={(memo) => setSharingMemo(memo)}
                settings={settings}
                isAddModalOpenInitially={autoOpenMedicineAdd}
              />
            )}

            {activeTab === 'saved' && (
              <SavedMemosView
                savedMemos={savedMemos}
                onDeleteMemo={handleDeleteMemo}
                onDuplicateMemo={handleDuplicateMemo}
                onLoadIntoActive={handleLoadIntoActive}
                onOpenShareModal={(memo) => setSharingMemo(memo)}
                settings={settings}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onDataReset={loadInitialData}
              />
            )}
          </>
        )}
      </main>

      {/* Share / Export Modal */}
      <ShareModal
        memo={sharingMemo}
        settings={settings}
        onClose={() => setSharingMemo(null)}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setAutoOpenMarketAdd(false);
          setAutoOpenMedicineAdd(false);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        marketPendingCount={marketPendingCount}
        medicineNeededCount={medicineNeededCount}
        savedMemosCount={savedMemos.length}
      />
    </div>
  );
}
