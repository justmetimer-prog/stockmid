import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Barcode, MapPin, Package } from 'lucide-react';
import { Product } from '../types/inventory';
import { generateRandomBarcode } from '../utils/barcodeGenerator';
import { CATEGORIES_LIST } from '../utils/mockData';
import { useInventory } from '../context/InventoryContext';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { language, t } = useInventory();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(CATEGORIES_LIST[0]);
  const [quantity, setQuantity] = useState<number>(10);
  const [minQuantity, setMinQuantity] = useState<number>(5);
  const [unit, setUnit] = useState('قطعة');
  
  // Location
  const [zone, setZone] = useState('المنطقة A - الآلات الثقيلة');
  const [aisle, setAisle] = useState('01');
  const [shelf, setShelf] = useState('A-1');
  const [bin, setBin] = useState('01');

  // Tracking
  const [batchNumber, setBatchNumber] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSku(initialData.sku);
      setBarcode(initialData.barcode);
      setCategory(initialData.category);
      setQuantity(initialData.quantity);
      setMinQuantity(initialData.minQuantity);
      setUnit(initialData.unit);
      setZone(initialData.location.zone);
      setAisle(initialData.location.aisle);
      setShelf(initialData.location.shelf);
      setBin(initialData.location.bin);
      setBatchNumber(initialData.batchNumber || '');
      setProductionDate(initialData.productionDate || '');
      setExpiryDate(initialData.expiryDate || '');
      setSupplier(initialData.supplier || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      const randomSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      setSku(randomSku);
      setBarcode(generateRandomBarcode());
      setCategory(CATEGORIES_LIST[0]);
      setQuantity(10);
      setMinQuantity(5);
      setUnit(language === 'ar' ? 'قطعة' : 'Pièce');
      setZone(language === 'ar' ? 'المنطقة A - الآلات الثقيلة' : 'Zone A - Machines Lourdes');
      setAisle('01');
      setShelf('A-1');
      setBin('01');
      setBatchNumber(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setProductionDate(new Date().toISOString().slice(0, 10));
      setExpiryDate('');
      setSupplier('');
      setNotes('');
    }
  }, [initialData, isOpen, language]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim()) return;

    onSave({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim(),
      category,
      quantity: Number(quantity),
      minQuantity: Number(minQuantity),
      unit,
      location: { zone, aisle, shelf, bin },
      batchNumber,
      productionDate,
      expiryDate: expiryDate || undefined,
      supplier: supplier.trim() || (language === 'ar' ? 'مورد عام' : 'Fournisseur standard'),
      notes,
    });
    onClose();
  };

  const handleRegenerateBarcode = () => {
    setBarcode(generateRandomBarcode());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-right rtl:text-right ltr:text-left space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData
                  ? (language === 'ar' ? 'تعديل بيانات السلعة' : 'Modifier l\'article')
                  : (language === 'ar' ? 'إضافة سلعة / معدة جديدة للمستودع' : 'Ajouter un nouvel article')}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'تسجيل الرمز الشريطي والباركود وموقع التخزين على الرف وحد الطلب الأدنى'
                  : 'Enregistrement code-barres, localisation sur étagère et seuil d\'alerte'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Product Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {language === 'ar' ? 'اسم السلعة / المعدة *' : 'Nom de l\'article / équipement *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: محرك كهربائي 3 فاز، مضخة هيدروليكية...' : 'Ex: Moteur électrique triphasé, Pompe hydraulique...'}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          {/* Barcode & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  {language === 'ar' ? 'رمز الباركود *' : 'Code-barres (Code128 / EAN) *'}
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateBarcode}
                  className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 text-[11px]"
                  title="Générer automatiquement"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{language === 'ar' ? 'توليد تلقائي' : 'Auto'}</span>
                </button>
              </div>
              <div className="relative">
                <Barcode className={`w-4 h-4 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 text-slate-500`} />
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className={`w-full ${language === 'ar' ? 'pl-3 pr-10' : 'pr-3 pl-10'} py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 font-bold`}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'رمز السلعة (SKU / الكود الداخلي)' : 'Code interne (SKU)'}
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="MOT-3PH-01"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'التصنيف الرئيسي *' : 'Catégorie principale *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'وحدة القياس' : 'Unité de mesure'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value={language === 'ar' ? 'قطعة' : 'Pièce'}>{language === 'ar' ? 'قطعة (Piece)' : 'Pièce'}</option>
                <option value={language === 'ar' ? 'صندوق' : 'Boîte'}>{language === 'ar' ? 'صندوق (Box)' : 'Boîte'}</option>
                <option value={language === 'ar' ? 'كرتون' : 'Carton'}>{language === 'ar' ? 'كرتون (Carton)' : 'Carton'}</option>
                <option value={language === 'ar' ? 'برميل' : 'Fût/Baril'}>{language === 'ar' ? 'برميل (Drum)' : 'Fût'}</option>
                <option value="كغ">كيلوغرام (Kg)</option>
                <option value="لتر">لتر (Litre)</option>
                <option value="متر">متر (Mètre)</option>
                <option value={language === 'ar' ? 'طقم' : 'Kit'}>{language === 'ar' ? 'طقم كامل (Set)' : 'Kit complet'}</option>
                <option value={language === 'ar' ? 'لفة' : 'Rouleau'}>{language === 'ar' ? 'لفة (Roll)' : 'Rouleau'}</option>
              </select>
            </div>
          </div>

          {/* Stock Quantities & Threshold (Zero Prices) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'الكمية المخزنة حالياً بالمستودع:' : 'Quantité initiale en stock :'}
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-amber-400 font-semibold mb-1">
                {language === 'ar' ? 'حد الأمان الأدنى (إشعار بنفاد الكمية) *:' : 'Seuil d\'alerte minimal * :'}
              </label>
              <input
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-900 border border-amber-500/30 rounded-lg text-amber-300 font-mono text-center font-bold text-sm focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                {language === 'ar' ? 'إشعار فوري عند وصول المخزون لهذه الكمية' : 'Notification dès que le stock atteint ce seuil'}
              </span>
            </div>
          </div>

          {/* Location Assignment */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'موقع التخزين داخل المستودع:' : 'Emplacement dans l\'entrepôt :'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">{language === 'ar' ? 'المنطقة:' : 'Zone :'}</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="المنطقة A - الآلات الثقيلة">Zone A</option>
                  <option value="المنطقة B - العدد والمستهلكات">Zone B</option>
                  <option value="المنطقة C - السوائل والمواد">Zone C</option>
                  <option value="المنطقة D - البضائع الضخمة">Zone D</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">{t.aisle} (Aisle):</label>
                <input
                  type="text"
                  value={aisle}
                  onChange={(e) => setAisle(e.target.value)}
                  placeholder="01"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">{t.shelfRack} (Shelf):</label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="A-1"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">{t.bin} (Bin):</label>
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="04"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Batch, Expiry & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'رقم الدفعة / التشغيلة:' : 'N° de Lot :'}
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="LOT-2026-X"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'تاريخ انتهاء الصلاحية:' : 'Date d\'expiration :'}
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'المورد الرئيسي:' : 'Fournisseur :'}
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder={language === 'ar' ? 'شركة التوريد أو المصنع...' : 'Fournisseur officiel...'}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {language === 'ar' ? 'تعليمات التخزين وملاحظات:' : 'Instructions de stockage :'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: يحفظ في مكان جاف ومحمي من الرطوبة...' : 'Ex: Conserver au sec, manipuler avec précaution...'}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors"
            >
              {initialData
                ? (language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer')
                : (language === 'ar' ? 'إضافة السلعة للمستودع' : 'Ajouter au Stock')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
