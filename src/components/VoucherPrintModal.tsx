import React, { useRef, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { MovementVoucher } from '../types/inventory';
import { renderBarcodeSvg } from '../utils/barcodeGenerator';
import { useInventory } from '../context/InventoryContext';

interface VoucherPrintModalProps {
  voucher: MovementVoucher | null;
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({ voucher, onClose }) => {
  const { language, t } = useInventory();
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (voucher && barcodeRef.current) {
      renderBarcodeSvg(barcodeRef.current, voucher.voucherNumber, {
        height: 38,
        width: 1.6,
        displayValue: true,
        fontSize: 12,
      });
    }
  }, [voucher]);

  if (!voucher) return null;

  const isReceipt = voucher.type === 'RECEIPT';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full text-right rtl:text-right ltr:text-left overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
        
        {/* Modal Action Header (no-print) */}
        <div className="no-print p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
              isReceipt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            }`}>
              {isReceipt
                ? (language === 'ar' ? 'وصل استلام وتوريد بضاعة' : 'Bon de Réception Logistique')
                : (language === 'ar' ? 'وصل إخراج وتسليم بضاعة' : 'Bon de Sortie & Expédition')}
            </span>
            <span className="font-mono text-xs text-slate-300 font-bold">{voucher.voucherNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printA4}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable A4 Logistics Slip (Zero Prices) */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 printable-area">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Document Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {language === 'ar' ? 'مخزون بلس لإدارة المستودعات' : 'StockPlus Logistics WMS'}
                </h1>
                <p className="text-xs text-slate-600">
                  {language === 'ar' ? 'نظام إدارة وتخزين المعدات والمنتجات اللوجستي' : 'Système de gestion et stockage d\'équipements'}
                </p>
                <div className="text-xs text-slate-500 pt-1">
                  {language === 'ar' ? 'المستودع اللوجستي المركزي · المنطقة الصناعية' : 'Entrepôt Central Principal · Zone Logistique'}
                </div>
              </div>

              {/* Barcode & Document Title */}
              <div className="flex flex-col items-end">
                <div className="text-right rtl:text-right ltr:text-left">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                    isReceipt ? 'bg-emerald-100 text-emerald-900' : 'bg-sky-100 text-sky-900'
                  }`}>
                    {isReceipt
                      ? (language === 'ar' ? 'وصل استلام بضاعة (إدخال مخزني)' : 'Bon de Réception (Entrée)')
                      : (language === 'ar' ? 'وصل إخراج بضاعة (صرف مخزني)' : 'Bon de Sortie (Expédition)')}
                  </span>
                </div>
                <div className="mt-2">
                  <svg ref={barcodeRef} />
                </div>
              </div>
            </div>

            {/* Voucher Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5 font-medium">{t.voucherNumber}:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{voucher.voucherNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-medium">{t.voucherDate}:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{voucher.date}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-medium">
                  {isReceipt ? (language === 'ar' ? 'المورد:' : 'Fournisseur :') : (language === 'ar' ? 'المستلم:' : 'Destinataire :')}
                </span>
                <span className="font-bold text-slate-900">{voucher.partyName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 font-medium">{t.refDoc}:</span>
                <span className="font-bold text-slate-900">{voucher.referenceDoc || '-'}</span>
              </div>
            </div>

            {/* Items Table (Pure Logistics, Zero Prices) */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">{t.colItem}</th>
                    <th className="py-2.5 px-3">Code / SKU</th>
                    <th className="py-2.5 px-3">{t.colLocation}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الكمية' : 'Quantité'}</th>
                    <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الوحدة' : 'Unité'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {voucher.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.productName}
                        {item.batchNumber && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {language === 'ar' ? 'الدفعة:' : 'Lot :'} {item.batchNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        <div>{item.barcode}</div>
                        <div className="text-[10px] text-slate-400">{item.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {item.location ? `${item.location.zone} (${item.location.aisle}-${item.location.shelf})` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-slate-700">
                      {language === 'ar' ? 'إجمالي عدد الوحدات المنقولة في الوصل:' : 'Total des unités transportées :'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-900 text-base">
                      {voucher.totalQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {language === 'ar' ? 'وحدة' : 'unités'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes if present */}
            {voucher.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                <span className="font-bold block mb-0.5">{language === 'ar' ? 'ملاحظات المستودع:' : 'Observations :'}</span>
                <p>{voucher.notes}</p>
              </div>
            )}

            {/* Signatures & Official Stamp Grid */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
              <div className="space-y-10">
                <span className="font-bold block">{t.warehouseKeeper}</span>
                <span className="block font-medium text-slate-900">{voucher.warehouseKeeper}</span>
                <div className="border-b border-dashed border-slate-400 mx-4" />
                <span className="text-[10px] text-slate-400">{language === 'ar' ? 'التوقيع والتاريخ' : 'Signature & Date'}</span>
              </div>

              <div className="space-y-10">
                <span className="font-bold block">
                  {isReceipt ? (language === 'ar' ? 'مندوب التوريد' : 'Livreur') : (language === 'ar' ? 'المستلم الفعلي' : 'Réceptionnaire')}
                </span>
                <span className="block font-medium text-slate-900">{voucher.receivedBy || voucher.partyName}</span>
                <div className="border-b border-dashed border-slate-400 mx-4" />
                <span className="text-[10px] text-slate-400">{language === 'ar' ? 'التوقيع والتاريخ' : 'Signature & Date'}</span>
              </div>

              <div className="flex flex-col items-center justify-between h-full">
                <span className="font-bold">{language === 'ar' ? 'ختم المستودع الرسمي' : 'Cachet Officiel Entrepôt'}</span>
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400">
                  {language === 'ar' ? 'ختم معتمد' : 'Approuvé'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
              {language === 'ar'
                ? `تم إصدار هذا الوصل آلياً من نظام «مخزون بلس» الذكي · تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}`
                : `Édité automatiquement par StockPlus WMS · Date d'impression : ${new Date().toLocaleDateString('fr-FR')}`}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
