import React from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ScanLine,
  MapPin,
  TrendingUp,
  Box,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { AppTab } from './Navbar';

interface DashboardViewProps {
  onNavigate: (tab: AppTab) => void;
  onOpenProductModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenProductModal,
}) => {
  const {
    language,
    t,
    products,
    vouchers,
    movements,
    alerts,
    setIsScannerOpen,
    openCreateVoucher,
    setScannedProduct,
  } = useInventory();

  // Pure Logistics & Inventory Metrics (No Prices)
  const totalItemTypes = products.length;
  const totalUnitsInStock = products.reduce((acc, p) => acc + p.quantity, 0);

  const lowStockCount = alerts.filter(
    (a) => a.type === 'LOW_STOCK' || a.type === 'OUT_OF_STOCK'
  ).length;

  const expiringCount = alerts.filter(
    (a) => a.type === 'EXPIRING_SOON' || a.type === 'EXPIRED'
  ).length;

  const totalReceipts = vouchers.filter((v) => v.type === 'RECEIPT').length;
  const totalDispatches = vouchers.filter((v) => v.type === 'DISPATCH').length;

  // Category breakdown by unit quantities
  const categoryStats = React.useMemo(() => {
    const map: Record<string, { count: number; units: number }> = {};
    products.forEach((p) => {
      const cat = p.category || (language === 'ar' ? 'غير مصنف' : 'Non classé');
      if (!map[cat]) map[cat] = { count: 0, units: 0 };
      map[cat].count += 1;
      map[cat].units += p.quantity;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        units: data.units,
        percentage: totalUnitsInStock > 0 ? Math.round((data.units / totalUnitsInStock) * 100) : 0,
      }))
      .sort((a, b) => b.units - a.units);
  }, [products, totalUnitsInStock, language]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Context */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {t.dashboardTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t.dashboardSubtitle}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openCreateVoucher('RECEIPT')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors whitespace-nowrap"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>{t.receiptVoucherBtn}</span>
          </button>

          <button
            onClick={() => openCreateVoucher('DISPATCH')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition-colors whitespace-nowrap"
          >
            <ArrowUpRight className="w-4 h-4 text-sky-400" />
            <span>{t.dispatchVoucherBtn}</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            <span>{t.scanItemBtn}</span>
          </button>
        </div>
      </div>

      {/* 3D Interactive Warehouse Banner Promo */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Box className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t.interactive3DTeaser}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                3D Live
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.interactive3DDesc}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('map')}
          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
        >
          <Eye className="w-4 h-4" />
          <span>{t.open3DView}</span>
        </button>
      </div>

      {/* Primary KPI Strip (Logistics & Volume Focused, Zero Prices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Product Catalog Items */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.totalItems}</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {totalItemTypes.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {categoryStats.length} {language === 'ar' ? 'تصنيف' : 'catégories'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>{language === 'ar' ? 'حالة التخزين' : 'État de stockage'}</span>
            <span className="font-mono text-emerald-400 font-medium">{language === 'ar' ? 'مستقر ومنظم' : 'Stable & Organisé'}</span>
          </div>
        </div>

        {/* KPI 2: Total Units Stored */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.totalUnits}</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tracking-tight text-amber-400 tabular-nums">
              {totalUnitsInStock.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
            </span>
            <span className="text-xs text-slate-400">
              {language === 'ar' ? 'وحدة فعلية' : 'unités physiques'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>{language === 'ar' ? 'متوسط الرصيد للصنف' : 'Moyenne par référence'}</span>
            <span className="font-mono text-slate-300">
              {totalItemTypes > 0 ? Math.round(totalUnitsInStock / totalItemTypes) : 0} {language === 'ar' ? 'وحدة' : 'u'}
            </span>
          </div>
        </div>

        {/* KPI 3: Low Stock Alerts */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.lowStockItems}</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${
              lowStockCount > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}>
              {lowStockCount.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
            </span>
            <span className="text-xs text-amber-500/80">
              {language === 'ar' ? 'تحتاج توريد' : 'Réapprovisionner'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>{language === 'ar' ? 'أصناف نافدة تماماً' : 'En rupture totale'}</span>
            <span className="font-mono text-rose-400">
              {alerts.filter((a) => a.type === 'OUT_OF_STOCK').length} {language === 'ar' ? 'صنف' : 'réf.'}
            </span>
          </div>
        </div>

        {/* KPI 4: Expiry Warnings */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.expiryAlerts}</span>
            <Clock className={`w-4 h-4 ${expiringCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${
              expiringCount > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {expiringCount.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
            </span>
            <span className="text-xs text-rose-400/80">
              {language === 'ar' ? 'خلال 30 يوم' : 'sous 30 jours'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>{language === 'ar' ? 'الوصولات المعتمدة' : 'Bons validés'}</span>
            <span className="font-mono text-slate-300">
              {totalReceipts} {language === 'ar' ? 'استلام' : 'entrées'} · {totalDispatches} {language === 'ar' ? 'صرف' : 'sorties'}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Stock Alerts Banner (if any exists) */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white">{t.alertsTitle}</h2>
            </div>
            <span className="text-xs text-amber-400 font-mono tabular-nums">
              {alerts.length} {language === 'ar' ? 'تنبيه مسجل' : 'alertes'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-200 line-clamp-1">{alert.productName}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono shrink-0 ${
                    alert.severity === 'danger'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {alert.type === 'OUT_OF_STOCK'
                      ? (language === 'ar' ? 'نافد' : 'Rupture')
                      : alert.type === 'LOW_STOCK'
                      ? (language === 'ar' ? 'منخفض' : 'Bas')
                      : alert.type === 'EXPIRED'
                      ? (language === 'ar' ? 'منتهي' : 'Expiré')
                      : (language === 'ar' ? 'قريب الانتهاء' : 'Proche')}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{alert.message}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>
                    {language === 'ar' ? 'الموقع' : 'Zone'}: {alert.location.zone} - {alert.location.aisle}
                  </span>
                  <button
                    onClick={() => {
                      const prod = products.find((p) => p.id === alert.productId);
                      if (prod) {
                        setScannedProduct(prod);
                        setIsScannerOpen(true);
                      }
                    }}
                    className="text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    {language === 'ar' ? 'تحديد المكان' : 'Localiser'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Analytics & Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Inbound/Outbound Units & Category Volume Breakdown */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Warehouse Operations Activity (Volume in Units) */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{t.warehouseActivity}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'مقارنة حجم البضائع الداخلة والخارجة بوحدات التخزين'
                    : 'Comparaison des volumes d\'articles entrés et sortis'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span>{t.inboundLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
                  <span>{t.outboundLabel}</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart for 6 Months (Units) */}
            <div className="pt-4 grid grid-cols-6 gap-3 sm:gap-6 items-end h-48 border-b border-slate-800 pb-4">
              {[
                { month: language === 'ar' ? 'مايو' : 'Mai', inbound: 42, outbound: 35 },
                { month: language === 'ar' ? 'يونيو' : 'Juin', inbound: 65, outbound: 50 },
                { month: language === 'ar' ? 'يوليو' : 'Juil', inbound: 55, outbound: 48 },
                { month: language === 'ar' ? 'أغسطس' : 'Août', inbound: 80, outbound: 62 },
                { month: language === 'ar' ? 'سبتمبر' : 'Sept', inbound: 70, outbound: 74 },
                { month: language === 'ar' ? 'أكتوبر' : 'Oct', inbound: 92, outbound: 58 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div
                      style={{ height: `${(item.inbound / 100) * 100}%` }}
                      className="w-full max-w-[20px] bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t transition-all relative"
                      title={`${t.inboundLabel}: ${item.inbound} u`}
                    />
                    <div
                      style={{ height: `${(item.outbound / 100) * 100}%` }}
                      className="w-full max-w-[20px] bg-sky-500/80 group-hover:bg-sky-400 rounded-t transition-all relative"
                      title={`${t.outboundLabel}: ${item.outbound} u`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{item.month}</span>
                </div>
              ))}
            </div>

            {/* Inbound/Outbound Summary Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">
                  {language === 'ar' ? 'إجمالي وصولات الاستلام' : 'Total Bons de Réception'}
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {totalReceipts}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">
                  {language === 'ar' ? 'إجمالي وصولات الإخراج' : 'Total Bons de Sortie'}
                </span>
                <span className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                  {totalDispatches}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">
                  {language === 'ar' ? 'معدل دوران المخزون' : 'Taux de Rotation'}
                </span>
                <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                  4.2x
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">
                  {language === 'ar' ? 'دقة الجرد والمطابقة' : 'Précision d\'Inventaire'}
                </span>
                <span className="text-lg font-bold font-mono text-purple-400 tabular-nums">
                  99.6%
                </span>
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown (Units Volume) */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {language === 'ar' ? 'توزيع الوحدات المخزنة حسب التصنيف' : 'Répartition des Volumes par Catégorie'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'نسبة كميات التخزين لكل قسم ومجموعة' : 'Part des quantités stockées par groupe'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {language === 'ar' ? 'عرض كافة السلع ←' : 'Tous les articles →'}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {categoryStats.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{cat.name}</span>
                    <div className="flex items-center gap-3 text-slate-400 font-mono tabular-nums">
                      <span>{cat.count} {language === 'ar' ? 'صنف' : 'réf.'}</span>
                      <span>·</span>
                      <span className="text-slate-200 font-bold">{cat.units} {language === 'ar' ? 'وحدة' : 'unités'}</span>
                      <span className="text-amber-400 font-bold w-10 text-left">{cat.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                      className="h-full bg-gradient-to-l from-amber-400 to-amber-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Quick Scanner, Recent Vouchers & Location Shortcut */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Scanner Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{t.scannerTitle}</h4>
              <p className="text-xs text-slate-400 mt-1">
                {t.scannerSubtitle}
              </p>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors shadow-sm"
            >
              {t.startCamera}
            </button>
          </div>

          {/* Recent Vouchers List */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{t.recentVouchers}</h4>
              <button
                onClick={() => onNavigate('vouchers')}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                {language === 'ar' ? `الكل (${vouchers.length})` : `Voir tout (${vouchers.length})`}
              </button>
            </div>

            <div className="space-y-3">
              {vouchers.slice(0, 4).map((voucher) => (
                <div
                  key={voucher.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {voucher.voucherNumber}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      voucher.type === 'RECEIPT'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                    }`}>
                      {voucher.type === 'RECEIPT' ? t.receiptVoucher : t.dispatchVoucher}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 truncate">
                    {voucher.partyName}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">{voucher.date}</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {voucher.totalQuantity} {language === 'ar' ? 'وحدة' : 'unités'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouse Zones Status Shortcut */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{t.zonesOccupancy}</h4>
              <button
                onClick={() => onNavigate('map')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {t.open3DView} →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { zone: 'A', title: language === 'ar' ? 'الآلات الثقيلة' : 'Machines Lourdes', color: 'border-blue-500/30 bg-blue-500/5' },
                { zone: 'B', title: language === 'ar' ? 'القطع والمستهلكات' : 'Pièces & Outillage', color: 'border-emerald-500/30 bg-emerald-500/5' },
                { zone: 'C', title: language === 'ar' ? 'السوائل والمواد' : 'Liquides & Huiles', color: 'border-amber-500/30 bg-amber-500/5' },
                { zone: 'D', title: language === 'ar' ? 'البضائع الضخمة' : 'Gros Volumes', color: 'border-purple-500/30 bg-purple-500/5' },
              ].map((z) => {
                const count = products.filter((p) => p.location.zone.includes(z.zone)).length;
                return (
                  <div
                    key={z.zone}
                    onClick={() => onNavigate('map')}
                    className={`p-3 rounded-lg border ${z.color} cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Zone {z.zone}</span>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">{z.title}</span>
                    <span className="text-[11px] font-mono text-slate-300 mt-2 block font-medium">
                      {count} {language === 'ar' ? 'أصناف مخزنة' : 'références'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
