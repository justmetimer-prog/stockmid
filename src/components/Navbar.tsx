import React from 'react';
import {
  Package,
  ScanLine,
  Bell,
  RefreshCw,
  Plus,
  Globe,
  Box,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export type AppTab = 'dashboard' | 'products' | 'vouchers' | 'map' | 'reports';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenProductModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenProductModal,
}) => {
  const { language, setLanguage, t, alerts, setIsScannerOpen, setIsAlertsDrawerOpen, resetToDemoData } = useInventory();
  const alertCount = alerts.length;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <button
            onClick={() => onTabChange('dashboard')}
            className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            {t.appName}
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'dashboard'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            {t.navDashboard}
          </button>
          
          <button
            onClick={() => onTabChange('products')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'products'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            {t.navProducts}
          </button>

          <button
            onClick={() => onTabChange('vouchers')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'vouchers'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            {t.navVouchers}
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'map'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            {t.navMap}
          </button>

          <button
            onClick={() => onTabChange('reports')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'reports'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'hover:text-white'
            }`}
          >
            {t.navReports}
          </button>
        </nav>

        {/* Zone 3: Actions & Language Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Language Switcher (العربية / Français) */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <button
              onClick={() => setLanguage('ar')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                language === 'ar'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="التبديل إلى اللغة العربية"
            >
              عربي
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                language === 'fr'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Passer en Français"
            >
              FR
            </button>
          </div>

          {/* Quick Scanner Action */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all shadow-sm whitespace-nowrap"
            title={t.scanBarcode}
          >
            <ScanLine className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t.scanBarcode}</span>
          </button>

          {/* Alerts Notification Button */}
          <button
            onClick={() => setIsAlertsDrawerOpen(true)}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title={t.alertsTitle}
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center font-mono">
                {alertCount}
              </span>
            )}
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (window.confirm(language === 'ar' ? 'هل ترغب في إعادة ضبط البيانات إلى النماذج التجريبية الأولية؟' : 'Voulez-vous réinitialiser les données de démonstration ?')) {
                resetToDemoData();
              }
            }}
            className="hidden lg:flex p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title={t.resetDemo}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenProductModal}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.addProduct}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 bg-slate-900 border-t border-slate-800 gap-4 text-xs font-medium no-scrollbar">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`whitespace-nowrap shrink-0 py-1 ${activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navDashboard}
        </button>
        <button
          onClick={() => onTabChange('products')}
          className={`whitespace-nowrap shrink-0 py-1 ${activeTab === 'products' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navProducts}
        </button>
        <button
          onClick={() => onTabChange('vouchers')}
          className={`whitespace-nowrap shrink-0 py-1 ${activeTab === 'vouchers' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navVouchers}
        </button>
        <button
          onClick={() => onTabChange('map')}
          className={`whitespace-nowrap shrink-0 py-1 ${activeTab === 'map' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navMap}
        </button>
        <button
          onClick={() => onTabChange('reports')}
          className={`whitespace-nowrap shrink-0 py-1 ${activeTab === 'reports' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navReports}
        </button>
      </div>
    </header>
  );
};
