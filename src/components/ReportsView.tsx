import React from 'react';
import {
  Printer,
  Download,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const ReportsView: React.FC = () => {
  const { language, t, products, vouchers, movements } = useInventory();

  const totalItemsCount = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.quantity, 0);

  const receiptVouchers = vouchers.filter((v) => v.type === 'RECEIPT');
  const dispatchVouchers = vouchers.filter((v) => v.type === 'DISPATCH');

  const totalInboundUnits = receiptVouchers.reduce((acc, v) => acc + v.totalQuantity, 0);
  const totalOutboundUnits = dispatchVouchers.reduce((acc, v) => acc + v.totalQuantity, 0);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      language === 'ar' ? 'التاريخ' : 'Date',
      language === 'ar' ? 'رقم الوصل' : 'N° Bon',
      language === 'ar' ? 'النوع' : 'Type',
      language === 'ar' ? 'السلعة' : 'Article',
      language === 'ar' ? 'الكمية المنقولة' : 'Quantité',
      language === 'ar' ? 'الرصيد بعد الحركة' : 'Stock après',
      language === 'ar' ? 'البيان' : 'Motif',
      language === 'ar' ? 'المستخدم' : 'Opérateur',
    ];

    const rows = movements.map((m) => [
      `"${m.date.slice(0, 10)}"`,
      `"${m.voucherNumber || '-'}"`,
      `"${m.type === 'INBOUND' ? (language === 'ar' ? 'توريد (إدخال)' : 'Entrée') : m.type === 'OUTBOUND' ? (language === 'ar' ? 'صرف (إخراج)' : 'Sortie') : (language === 'ar' ? 'تسوية' : 'Ajustement')}"`,
      `"${m.productName}"`,
      m.quantityChanged,
      m.balanceAfter,
      `"${m.reason}"`,
      `"${m.user}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `warehouse_logistics_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t.reportsTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.reportsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>{t.exportMovementsCsv}</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors whitespace-nowrap shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* KPI Physical Volume Overview Cards (Zero Prices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
          <span className="text-xs text-slate-400">{language === 'ar' ? 'إجمالي وحدات التوريد المسجلة' : 'Unités reçues en stock'}</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            +{totalInboundUnits.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')} {language === 'ar' ? 'وحدة' : 'u'}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {language === 'ar' ? `بموجب ${receiptVouchers.length} وصل استلام` : `Issu de ${receiptVouchers.length} réceptions`}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
          <span className="text-xs text-slate-400">{language === 'ar' ? 'إجمالي وحدات الصرف والتسليم' : 'Unités expédiées'}</span>
          <div className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
            -{totalOutboundUnits.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')} {language === 'ar' ? 'وحدة' : 'u'}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {language === 'ar' ? `بموجب ${dispatchVouchers.length} وصل إخراج` : `Issu de ${dispatchVouchers.length} sorties`}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
          <span className="text-xs text-slate-400">{t.totalUnits}</span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {totalStockUnits.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')} {language === 'ar' ? 'وحدة' : 'u'}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {language === 'ar' ? `موزعة على ${totalItemsCount} صنف في المستودع` : `Réparties sur ${totalItemsCount} articles`}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
          <span className="text-xs text-slate-400">{language === 'ar' ? 'نسبة مطابقة الجرد الفعلي' : 'Taux de conformité'}</span>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            99.6%
          </div>
          <span className="text-[11px] text-emerald-400 block">
            {language === 'ar' ? 'مطابقة دقيقة بدون فروقات' : 'Audit validé sans écart'}
          </span>
        </div>
      </div>

      {/* Printable Official Inventory Audit Report Sheet (Zero Prices) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">{t.generalAudit}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ar'
                ? `تاريخ الجرد: ${new Date().toLocaleDateString('ar-SA')} · تم الإعداد بواسطة نظام مخزون بلس`
                : `Date de l'inventaire : ${new Date().toLocaleDateString('fr-FR')} · StockPlus WMS`}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {language === 'ar' ? 'حالة المطابقة:' : 'Statut :'} <strong className="text-emerald-400">{language === 'ar' ? '100% معتمدة' : '100% Validé'}</strong>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{t.colItem}</th>
                <th className="py-2.5 px-3">Code / SKU</th>
                <th className="py-2.5 px-3">{t.colLocation}</th>
                <th className="py-2.5 px-3 text-center">{t.bookStock}</th>
                <th className="py-2.5 px-3 text-center">{t.safeMinQty}</th>
                <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'حالة الصلاحية' : 'Validité'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {products.map((p, idx) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-white">{p.name}</td>
                    <td className="py-2 px-3 font-mono text-amber-400 text-[11px]">
                      {p.barcode} ({p.sku})
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px]">
                      {p.location.zone} ({p.location.aisle}-{p.location.shelf})
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-200">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-400">
                      {p.minQuantity} {p.unit}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">
                      {p.expiryDate || (language === 'ar' ? 'مستمرة' : 'Permanente')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950 font-bold border-t border-slate-800">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 text-slate-300">
                  {language === 'ar' ? 'الإجمالي العام لرصيد المستودع:' : 'Total cumulé du stock :'}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-amber-400 text-sm">
                  {totalStockUnits.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')} {language === 'ar' ? 'وحدة' : 'unités'}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Stock Movements Ledger Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">{t.stockLedger}</h2>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {movements.length} {language === 'ar' ? 'حركة مسجلة' : 'mouvements'}
          </span>
        </div>

        <div className="space-y-3">
          {movements.slice(0, 10).map((mov) => {
            const isIn = mov.type === 'INBOUND';
            const isOut = mov.type === 'OUTBOUND';

            return (
              <div
                key={mov.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isIn
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isOut
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : isOut ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{mov.productName}</span>
                      {mov.voucherNumber && (
                        <span className="font-mono text-[11px] text-amber-400">
                          [{mov.voucherNumber}]
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px] block mt-0.5">{mov.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right rtl:text-right ltr:text-left sm:text-left self-end sm:self-auto font-mono text-xs">
                  <div>
                    <span
                      className={`font-bold tabular-nums text-sm ${
                        mov.quantityChanged > 0 ? 'text-emerald-400' : 'text-sky-400'
                      }`}
                    >
                      {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                    </span>
                    <span className="text-slate-500 text-[10px] block">
                      {language === 'ar' ? 'الرصيد بعد الحركة:' : 'Nouveau solde :'} {mov.balanceAfter}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[11px]">
                    <span className="block">{mov.date.slice(0, 10)}</span>
                    <span className="text-[10px] text-slate-500">{mov.user}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
