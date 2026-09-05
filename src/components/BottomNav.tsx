import React from 'react';
import { Home, ShoppingCart, Pill, BookMarked, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  marketPendingCount?: number;
  medicineNeededCount?: number;
  savedMemosCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  marketPendingCount = 0,
  medicineNeededCount = 0,
  savedMemosCount = 0,
}) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'হোম', icon: Home, badge: null },
    { id: 'market' as ActiveTab, label: 'বাজার', icon: ShoppingCart, badge: marketPendingCount > 0 ? marketPendingCount : null },
    { id: 'medicine' as ActiveTab, label: 'ঔষধ', icon: Pill, badge: medicineNeededCount > 0 ? medicineNeededCount : null },
    { id: 'saved' as ActiveTab, label: 'সংরক্ষিত', icon: BookMarked, badge: savedMemosCount > 0 ? savedMemosCount : null },
    { id: 'settings' as ActiveTab, label: 'সেটিংস', icon: Settings, badge: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center relative py-1 transition-all duration-200 active:scale-95 ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center border-2 border-white shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-emerald-800' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
