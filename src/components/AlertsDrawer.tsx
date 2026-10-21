import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowDownLeft,
  MapPin,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const AlertsDrawer: React.FC = () => {
  const {
    language,
    t,
    alerts,
    isAlertsDrawerOpen,
    setIsAlertsDrawerOpen,
    products,
    setScannedProduct,
    setIsScannerOpen,
    openCreateVoucher,
  } = useInventory();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STOCK' | 'EXPIRY'>('ALL');

  if (!isAlertsDrawerOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'STOCK') {
      return a.type === 'LOW_STOCK' || a.type === 'OUT_OF_STOCK';
    }
    if (activeFilter === 'EXPIRY') {
      return a.type === 'EXPIRING_SOON' || a.type === 'EXPIRED';
    }
    return true;
  });

  const lowStockCount = alerts.filter(
    (a) => a.type === 'LOW_STOCK' || a.type === 'OUT_OF_STOCK'
  ).length;

  const expiryCount = alerts.filter(
    (a) => a.type === 'EXPIRING_SOON' || a.type === 'EXPIRED'
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl text-right rtl:text-right ltr:text-left animate-slideLeft">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.alertsTitle}</h2>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'رصد فوري لمستويات الأمان وتواريخ الصلاحية' : 'Surveillance temps réel des seuils et péremptions'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAlertsDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            {t.filterAll} ({alerts.length})
          </button>

          <button
            onClick={() => setActiveFilter('STOCK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'STOCK'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-400 hover:text-amber-300 bg-slate-950 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'نقص المخزون' : 'Stock bas'} ({lowStockCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('EXPIRY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'EXPIRY'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-rose-400 hover:text-rose-300 bg-slate-950 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الصلاحية' : 'Péremption'} ({expiryCount})</span>
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-white">
                {language === 'ar' ? 'المستودع في حالة ممتازة ومثالية' : 'Stock en parfait état'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'لا توجد نواقص أو سلع قريبة الانتهاء حالياً' : 'Aucune alerte active pour le moment'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isOut = alert.type === 'OUT_OF_STOCK';
              const isExp = alert.type === 'EXPIRED';
              const isExpSoon = alert.type === 'EXPIRING_SOON';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border text-xs space-y-2.5 transition-colors ${
                    alert.severity === 'danger'
                      ? 'bg-rose-950/20 border-rose-500/40 text-slate-200'
                      : 'bg-amber-950/20 border-amber-500/40 text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm line-clamp-1">{alert.productName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        alert.severity === 'danger'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isOut
                        ? (language === 'ar' ? 'نفد تماماً' : 'Rupture')
                        : isExp
                        ? (language === 'ar' ? 'انتهت الصلاحية' : 'Expiré')
                        : isExpSoon
                        ? (language === 'ar' ? 'قريب الانتهاء' : 'Proche')
                        : (language === 'ar' ? 'تحت حد الطلب' : 'Seuil min')}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{alert.message}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-2">
                    <span>
                      {language === 'ar' ? 'الموقع:' : 'Emplacement :'} {alert.location.zone} ({alert.location.aisle}-{alert.location.shelf})
                    </span>
                    <span>{alert.currentQty} {language === 'ar' ? 'وحدة' : 'u'}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setIsAlertsDrawerOpen(false);
                        const prod = products.find((p) => p.id === alert.productId);
                        if (prod) {
                          setScannedProduct(prod);
                          setIsScannerOpen(true);
                        }
                      }}
                      className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 text-[11px]"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تحديد الرف' : 'Localiser'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAlertsDrawerOpen(false);
                        openCreateVoucher('RECEIPT');
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 text-[11px] transition-colors"
                    >
                      <ArrowDownLeft className="w-3 h-3" />
                      <span>{language === 'ar' ? 'طلب توريد (استلام)' : 'Bon de Réception'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 text-center">
          {language === 'ar'
            ? 'تحديث آلي فوري لحالة الأرصدة مع كل إدخال أو إخراج'
            : 'Mise à jour en direct des stocks et seuils critiques'}
        </div>

      </div>
    </div>
  );
};
