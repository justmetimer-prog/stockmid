import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  ScanLine,
  MapPin,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Barcode,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useInventory } from '../context/InventoryContext';
import { renderBarcodeSvg } from '../utils/barcodeGenerator';

export const BarcodeScannerModal: React.FC = () => {
  const {
    language,
    t,
    isScannerOpen,
    setIsScannerOpen,
    scannedProduct,
    setScannedProduct,
    getProductByBarcode,
    products,
    setSelectedProductForBarcode,
    openCreateVoucher,
  } = useInventory();

  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (scannedProduct && barcodeSvgRef.current) {
      renderBarcodeSvg(barcodeSvgRef.current, scannedProduct.barcode, {
        height: 45,
        width: 1.8,
        displayValue: true,
      });
    }
  }, [scannedProduct]);

  useEffect(() => {
    if (!isScannerOpen) {
      stopCamera();
      setScanError(null);
    }
  }, [isScannerOpen]);

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setScanError(null);

      const html5QrCode = new Html5Qrcode('reader-view');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.333334,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleFoundBarcode(decodedText);
        },
        () => {}
      );

      setIsCameraActive(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera failed to start:', err);
      setIsCameraActive(false);
      setCameraLoading(false);
      setScanError(
        language === 'ar'
          ? 'تعذر تشغيل الكاميرا تلقائياً (قد تتطلب إذناً من المتصفح). يمكنك إدخال الباركود يدوياً أو تجربة أحد الباركودات التجريبية بالأسفل.'
          : 'Impossible de démarrer la caméra. Vous pouvez saisir le code manuellement ou utiliser un code de test ci-dessous.'
      );
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
    }
    scannerRef.current = null;
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  const handleFoundBarcode = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    const product = getProductByBarcode(cleanBarcode);

    if (product) {
      setScannedProduct(product);
      setScanError(null);
      stopCamera();
    } else {
      setScanError(
        language === 'ar'
          ? `الباركود [${cleanBarcode}] غير مسجل في قاعدة بيانات المستودع!`
          : `Code [${cleanBarcode}] non trouvé dans l'entrepôt !`
      );
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleFoundBarcode(manualInput);
  };

  const handleClose = () => {
    stopCamera();
    setIsScannerOpen(false);
  };

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-7 text-right rtl:text-right ltr:text-left relative shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.scannerTitle}</h2>
              <p className="text-xs text-slate-400">{t.scannerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan & Camera Area */}
        {!scannedProduct && (
          <div className="space-y-5">
            <div className="relative rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 p-4 text-center min-h-[260px] flex flex-col items-center justify-center overflow-hidden">
              <div id="reader-view" className="w-full max-w-sm rounded-xl overflow-hidden mx-auto" />

              {!isCameraActive && (
                <div className="space-y-4 py-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-sm font-semibold text-white">
                      {language === 'ar' ? 'جاهز للمسح المباشر بالكاميرا' : 'Prêt pour le scan par caméra'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'ar'
                        ? 'يدعم قراءة باركود المنتجات 1D (Code128 / EAN-13) ورموز QR Code'
                        : 'Prend en charge les codes 1D (Code128 / EAN-13) et QR Codes'}
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>{cameraLoading ? (language === 'ar' ? 'جاري التهيئة...' : 'Initialisation...') : t.startCamera}</span>
                  </button>
                </div>
              )}

              {isCameraActive && (
                <button
                  onClick={stopCamera}
                  className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
                >
                  {t.stopCamera}
                </button>
              )}
            </div>

            {/* Error Message */}
            {scanError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-semibold">{scanError}</p>
              </div>
            )}

            {/* Manual input / Barcode Gun */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <span className="text-xs font-medium text-slate-300 block">
                {language === 'ar'
                  ? 'أو اكتب الباركود / استخدم قارئ الباركود اليدوي:'
                  : 'Ou saisissez le code / utilisez une douchette :'}
              </span>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="6281002938101..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 transition-colors"
                >
                  {language === 'ar' ? 'بحث' : 'Rechercher'}
                </button>
              </form>

              {/* Quick Click Demo Barcodes */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500 block mb-2">
                  {language === 'ar' ? 'اختبار سريع: انقر على أي كود للتجربة:' : 'Test rapide : cliquez sur un code :'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleFoundBarcode(p.barcode)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      {p.barcode} ({p.name.slice(0, 14)}...)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Found Product Result & Warehouse Location (Zero Prices) */}
        {scannedProduct && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">{t.itemFound}</span>
              </div>
              <button
                onClick={() => {
                  setScannedProduct(null);
                  setScanError(null);
                }}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-200 font-medium underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'مسح كود آخر' : 'Scanner un autre'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Product Info (7 cols, Zero Prices) */}
              <div className="md:col-span-7 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <span className="text-xs text-amber-400 font-medium">{scannedProduct.category}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{scannedProduct.name}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>SKU: {scannedProduct.sku}</span>
                    <span>·</span>
                    <span>{language === 'ar' ? 'الدفعة:' : 'Lot :'} {scannedProduct.batchNumber || 'LOT-OK'}</span>
                  </div>
                </div>

                {/* SVG Barcode Rendered */}
                <div className="p-3 bg-white rounded-lg flex flex-col items-center justify-center">
                  <svg ref={barcodeSvgRef} className="max-w-full" />
                </div>

                {/* Logistics Metrics */}
                <div className="grid grid-cols-2 gap-3 text-center text-xs pt-2 border-t border-slate-800">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{language === 'ar' ? 'الرصيد الفعلي بالمخزن' : 'Stock en magasin'}</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                      {scannedProduct.quantity} {scannedProduct.unit}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{t.safeMinQty}</span>
                    <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                      {scannedProduct.minQuantity} {scannedProduct.unit}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>{language === 'ar' ? 'المورد:' : 'Fournisseur :'} <strong className="text-slate-200">{scannedProduct.supplier}</strong></p>
                  {scannedProduct.notes && (
                    <p className="text-slate-400 italic">{language === 'ar' ? 'ملاحظات:' : 'Notes :'} {scannedProduct.notes}</p>
                  )}
                </div>
              </div>

              {/* Visual Warehouse Shelf Locator (5 cols) */}
              <div className="md:col-span-5 p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{language === 'ar' ? 'موقع التخزين الدقيق في المستودع' : 'Emplacement Rayon'}</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {scannedProduct.location.zone}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {t.aisle}: <strong className="text-amber-400 font-bold">{scannedProduct.location.aisle}</strong> · 
                    {t.shelfRack}: <strong className="text-amber-400 font-bold">{scannedProduct.location.shelf}</strong> · 
                    {t.bin}: <strong className="text-amber-400 font-bold">{scannedProduct.location.bin}</strong>
                  </div>
                </div>

                {/* 2D Shelf Visual Graphic */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {t.shelfPlan} ({t.aisle} {scannedProduct.location.aisle}):
                  </span>
                  
                  <div className="space-y-1.5 font-mono text-xs">
                    {['R-3', 'R-2', 'R-1'].map((level, i) => {
                      const isCurrentShelf =
                        scannedProduct.location.shelf.includes(level) ||
                        scannedProduct.location.shelf.includes(`${3 - i}`);
                      return (
                        <div
                          key={level}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isCurrentShelf
                              ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 ring-2 ring-amber-400/30 scale-102 shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          {language === 'ar' ? `المستوى ${level}` : `Niveau ${level}`} {isCurrentShelf && '📍 [Emplacement]'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Actions from Scan */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedProductForBarcode(scannedProduct);
                      handleClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/20 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Barcode className="w-4 h-4" />
                    <span>{t.printSticker}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        handleClose();
                        openCreateVoucher('RECEIPT');
                      }}
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>{language === 'ar' ? 'توريد' : 'Entrée'}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleClose();
                        openCreateVoucher('DISPATCH');
                      }}
                      className="py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>{language === 'ar' ? 'صرف' : 'Sortie'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
