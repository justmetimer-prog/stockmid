import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Copy, Check } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { renderBarcodeSvg, generateQrCodeDataUrl } from '../utils/barcodeGenerator';

export const BarcodePrintModal: React.FC = () => {
  const { language, t, selectedProductForBarcode, setSelectedProductForBarcode } = useInventory();
  const [printCount, setPrintCount] = useState<number>(6);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showLocation, setShowLocation] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (selectedProductForBarcode) {
      if (barcodeSvgRef.current) {
        renderBarcodeSvg(barcodeSvgRef.current, selectedProductForBarcode.barcode, {
          height: 48,
          width: 1.8,
          displayValue: true,
          fontSize: 13,
        });
      }

      const qrPayload = JSON.stringify({
        barcode: selectedProductForBarcode.barcode,
        sku: selectedProductForBarcode.sku,
        name: selectedProductForBarcode.name,
        loc: `${selectedProductForBarcode.location.zone}-${selectedProductForBarcode.location.aisle}-${selectedProductForBarcode.location.shelf}`,
      });

      generateQrCodeDataUrl(qrPayload).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [selectedProductForBarcode]);

  if (!selectedProductForBarcode) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(selectedProductForBarcode.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-right rtl:text-right ltr:text-left space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.printBarcodeTitle}</h2>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'تجهيز الملصق للطباعة الحرارية أو ورق الملصقات A4 للصقه على المنتج'
                  : 'Préparation d\'étiquettes pour imprimante thermique ou feuille A4'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedProductForBarcode(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Header */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-amber-400 font-medium">{selectedProductForBarcode.category}</span>
            <h3 className="text-base font-bold text-white">{selectedProductForBarcode.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <span>Code: {selectedProductForBarcode.barcode}</span>
              <span>·</span>
              <span>SKU: {selectedProductForBarcode.sku}</span>
            </div>
          </div>
          <button
            onClick={handleCopyBarcode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (language === 'ar' ? 'تم النسخ!' : 'Copié !') : (language === 'ar' ? 'نسخ الكود' : 'Copier')}</span>
          </button>
        </div>

        {/* Sticker Preview (Physical Clean Label, Zero Prices) */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            {language === 'ar' ? 'معاينة شكل الملصق الفعلي:' : 'Aperçu physique de l\'étiquette :'}
          </span>
          
          <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
            <div className="w-[320px] bg-white text-slate-900 rounded-lg p-3.5 shadow-xl border border-slate-300 text-right rtl:text-right ltr:text-left space-y-2 select-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                  {t.appName} WMS
                </span>
                <span className="text-[10px] font-mono text-slate-500">{selectedProductForBarcode.sku}</span>
              </div>

              <div className="font-bold text-xs leading-tight text-slate-900 line-clamp-2">
                {selectedProductForBarcode.name}
              </div>

              <div className="flex items-center justify-between gap-2 py-1">
                <div className="flex-1 flex flex-col items-center">
                  <svg ref={barcodeSvgRef} className="max-w-full" />
                </div>
                {showQrCode && qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="w-12 h-12 border border-slate-200 p-0.5 rounded ml-2" />
                )}
              </div>

              <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-[10px] text-slate-700 font-medium">
                {showLocation && (
                  <span className="truncate">
                    📍 {selectedProductForBarcode.location.zone} ({selectedProductForBarcode.location.aisle}-{selectedProductForBarcode.location.shelf})
                  </span>
                )}
                <span className="font-mono text-slate-500">
                  {selectedProductForBarcode.batchNumber || 'LOT-OK'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">{t.copiesCount}:</label>
            <div className="flex items-center gap-2">
              {[1, 4, 6, 8, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPrintCount(num)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-colors ${
                    printCount === num
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">
              {language === 'ar' ? 'خيارات الملصق:' : 'Éléments inclus :'}
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="rounded text-amber-400 focus:ring-0"
                />
                <span>QR Code</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showLocation}
                  onChange={(e) => setShowLocation(e.target.checked)}
                  className="rounded text-amber-400 focus:ring-0"
                />
                <span>{language === 'ar' ? 'موقع الرف' : 'Emplacement'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedProductForBarcode(null)}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printNow} ({printCount})</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Only visible during window.print) */}
      <div className="hidden print-only printable-area bg-white text-black p-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: printCount }).map((_, index) => (
            <div
              key={index}
              className="border border-black/30 p-3 rounded text-right rtl:text-right ltr:text-left space-y-1 page-break-inside-avoid"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <div className="flex justify-between items-center text-[10px] text-gray-700 border-b border-gray-300 pb-1">
                <span className="font-bold">{t.appName} WMS</span>
                <span className="font-mono">{selectedProductForBarcode.sku}</span>
              </div>

              <div className="font-bold text-xs text-black leading-tight">
                {selectedProductForBarcode.name}
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 text-center font-mono">
                  <div className="text-xl font-bold tracking-widest">{selectedProductForBarcode.barcode}</div>
                  <div className="text-[10px] text-gray-600">||| | |||| ||| |||| | ||| ||||</div>
                </div>
                {showQrCode && qrDataUrl && (
                  <img src={qrDataUrl} alt="QR" className="w-12 h-12 ml-2" />
                )}
              </div>

              <div className="border-t border-gray-300 pt-1 flex justify-between text-[10px] text-gray-800 font-bold">
                {showLocation && (
                  <span>
                    {selectedProductForBarcode.location.zone} ({selectedProductForBarcode.location.aisle}-{selectedProductForBarcode.location.shelf})
                  </span>
                )}
                <span className="font-mono">{selectedProductForBarcode.batchNumber || 'LOT-OK'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
