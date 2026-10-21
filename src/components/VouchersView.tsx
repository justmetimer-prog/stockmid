import React, { useState } from 'react';
import {
  Plus,
  Search,
  Printer,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { MovementVoucher, VoucherType, VoucherItem } from '../types/inventory';
import { VoucherPrintModal } from './VoucherPrintModal';

export const VouchersView: React.FC = () => {
  const {
    language,
    t,
    vouchers,
    deleteVoucher,
    createVoucher,
    products,
    selectedVoucherForPrint,
    setSelectedVoucherForPrint,
    isCreateVoucherOpen,
    openCreateVoucher,
    closeCreateVoucher,
    activeVoucherType,
  } = useInventory();

  const [filterType, setFilterType] = useState<'ALL' | 'RECEIPT' | 'DISPATCH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Voucher Form States (Zero Prices)
  const [formVoucherType, setFormVoucherType] = useState<VoucherType>('RECEIPT');
  const [partyName, setPartyName] = useState('');
  const [partyContact, setPartyContact] = useState('');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
  const [warehouseKeeper, setWarehouseKeeper] = useState(language === 'ar' ? 'أمين المستودع الرئيسي' : 'Responsable Logistique');
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dynamic line items (Quantities only)
  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
  }>>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isCreateVoucherOpen) {
      setFormVoucherType(activeVoucherType);
      setItems([{ productId: products[0]?.id || '', quantity: 1 }]);
      setFormError(null);
    }
  }, [isCreateVoucherOpen, activeVoucherType, products]);

  const filteredVouchers = vouchers
    .filter((v) => {
      if (filterType !== 'ALL' && v.type !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.voucherNumber.toLowerCase().includes(q) ||
        v.partyName.toLowerCase().includes(q) ||
        v.referenceDoc.toLowerCase().includes(q) ||
        v.warehouseKeeper.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setItems([...items, { productId: firstProd.id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], productId };
    setItems(updated);
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const calculateTotalUnits = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!partyName.trim()) {
      setFormError(
        formVoucherType === 'RECEIPT'
          ? (language === 'ar' ? 'يرجى كتابة اسم المورد' : 'Veuillez saisir le nom du fournisseur')
          : (language === 'ar' ? 'يرجى كتابة اسم العميل أو الجهة المستلمة' : 'Veuillez saisir le nom du destinataire')
      );
      return;
    }

    // Validation for outbound: quantity check against stock
    if (formVoucherType === 'DISPATCH') {
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) {
          setFormError(language === 'ar' ? 'صنف غير معروف في قائمة البنود' : 'Article inconnu');
          return;
        }
        if (prod.quantity < item.quantity) {
          setFormError(
            language === 'ar'
              ? `الكمية المطلوبة للصنف "${prod.name}" (${item.quantity} ${prod.unit}) تفوق الرصيد الفعلي المتوفر بالمستودع (${prod.quantity} ${prod.unit})!`
              : `Quantité demandée pour "${prod.name}" (${item.quantity}) supérieure au stock disponible (${prod.quantity}) !`
          );
          return;
        }
      }
    }

    const voucherItems: VoucherItem[] = items.map((i) => {
      const prod = products.find((p) => p.id === i.productId)!;
      return {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        sku: prod.sku,
        quantity: i.quantity,
        unit: prod.unit,
        batchNumber: prod.batchNumber,
        location: prod.location,
      };
    });

    const prefix = formVoucherType === 'RECEIPT' ? 'REC' : 'DIS';
    const year = new Date().getFullYear();
    const count = vouchers.filter((v) => v.type === formVoucherType).length + 1;
    const voucherNumber = `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const created = createVoucher({
      type: formVoucherType,
      voucherNumber,
      date: voucherDate,
      partyName,
      partyContact,
      referenceDoc,
      warehouseKeeper,
      receivedBy,
      notes,
      items: voucherItems,
      totalQuantity: calculateTotalUnits(),
      status: 'CONFIRMED',
    });

    closeCreateVoucher();
    setSelectedVoucherForPrint(created);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t.vouchersTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.vouchersSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateVoucher('RECEIPT')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newReceiptBtn}</span>
          </button>

          <button
            onClick={() => openCreateVoucher('DISPATCH')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors whitespace-nowrap shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>{t.newDispatchBtn}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 text-slate-400 pointer-events-none`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث برقم الوصل، اسم الطرف، أو المرجع...' : 'Recherche par n° bon, nom ou réf...'}
            className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400`}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {language === 'ar' ? `جميع الوصولات (${vouchers.length})` : `Tous (${vouchers.length})`}
          </button>

          <button
            onClick={() => setFilterType('RECEIPT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'RECEIPT'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-950/80 text-emerald-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'وصولات استلام' : 'Réceptions'} ({vouchers.filter((v) => v.type === 'RECEIPT').length})</span>
          </button>

          <button
            onClick={() => setFilterType('DISPATCH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'DISPATCH'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-slate-950/80 text-sky-400 hover:text-sky-300 border border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'وصولات إخراج' : 'Expéditions'} ({vouchers.filter((v) => v.type === 'DISPATCH').length})</span>
          </button>
        </div>
      </div>

      {/* Vouchers Table (Zero Prices) */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800 text-[11px] font-medium tracking-wider">
              <tr>
                <th className="py-3 px-4">{t.voucherNumber}</th>
                <th className="py-3 px-4">{t.voucherDate}</th>
                <th className="py-3 px-4">{language === 'ar' ? 'الطرف الثاني (المورد / العميل)' : 'Tiers (Fournisseur / Client)'}</th>
                <th className="py-3 px-4">{t.refDoc}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'عدد البنود' : 'Lignes'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'إجمالي الكمية' : 'Quantité totale'}</th>
                <th className="py-3 px-4">{t.warehouseKeeper}</th>
                <th className="py-3 px-4 text-center">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">
                      {language === 'ar' ? 'لا توجد وصولات مسجلة مطابقة للبحث' : 'Aucun bon correspondant'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => {
                  const isRec = voucher.type === 'RECEIPT';
                  return (
                    <tr
                      key={voucher.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Number & Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded ${
                              isRec ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            {isRec ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-mono font-bold text-white text-sm">{voucher.voucherNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isRec ? t.receiptVoucher : t.dispatchVoucher}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {voucher.date}
                      </td>

                      {/* Party */}
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {voucher.partyName}
                        {voucher.partyContact && (
                          <span className="block text-[10px] text-slate-500 font-mono font-normal">
                            {voucher.partyContact}
                          </span>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-4 text-slate-400">
                        {voucher.referenceDoc || '-'}
                      </td>

                      {/* Items Count */}
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-300">
                        {voucher.items.length} {language === 'ar' ? 'بند' : 'lignes'}
                      </td>

                      {/* Total Units */}
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-amber-400 text-sm">
                        {voucher.totalQuantity} {language === 'ar' ? 'وحدة' : 'unités'}
                      </td>

                      {/* Warehouse Keeper */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {voucher.warehouseKeeper}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedVoucherForPrint(voucher)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                            title={t.printA4}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(language === 'ar' ? `هل أنت متأكد من حذف الوصل رقم ${voucher.voucherNumber}؟` : `Supprimer le bon ${voucher.voucherNumber} ?`)) {
                                deleteVoucher(voucher.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Voucher Modal */}
      {isCreateVoucherOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 text-right rtl:text-right ltr:text-left space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    formVoucherType === 'RECEIPT'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}
                >
                  {formVoucherType === 'RECEIPT' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {formVoucherType === 'RECEIPT' ? t.newReceiptBtn : t.newDispatchBtn}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {formVoucherType === 'RECEIPT'
                      ? (language === 'ar' ? 'تحديث تلقائي للمخزون بإضافة الكميات المستلمة' : 'Mise à jour automatique par ajout au stock')
                      : (language === 'ar' ? 'تحديث تلقائي للمخزون بخصم الكميات المصروفة' : 'Mise à jour automatique par déduction du stock')}
                  </p>
                </div>
              </div>
              <button onClick={closeCreateVoucher} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSaveVoucher} className="space-y-6">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormVoucherType('RECEIPT')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                    formVoucherType === 'RECEIPT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>{t.receiptVoucher}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormVoucherType('DISPATCH')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                    formVoucherType === 'DISPATCH'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{t.dispatchVoucher}</span>
                </button>
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {formVoucherType === 'RECEIPT' ? (language === 'ar' ? 'اسم المورد *' : 'Fournisseur *') : (language === 'ar' ? 'اسم العميل / المستلم *' : 'Destinataire *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    placeholder={formVoucherType === 'RECEIPT' ? (language === 'ar' ? 'مثال: شركة التوريدات الصناعية' : 'Ex: Fournisseur SARL') : (language === 'ar' ? 'مثال: مصنع الأمل' : 'Ex: Client Atelier')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'ar' ? 'الوثيقة المرجعية (فاتورة / إذن):' : 'Référence / N° BL :'}
                  </label>
                  <input
                    type="text"
                    value={referenceDoc}
                    onChange={(e) => setReferenceDoc(e.target.value)}
                    placeholder="INV-2026-402 / BL-88"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.voucherDate}:</label>
                  <input
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Items List in Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {language === 'ar' ? 'قائمة السلع والكميات المنقولة:' : 'Articles et quantités à mouvementer :'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إضافة بند آخر' : '+ Ajouter une ligne'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                      >
                        {/* Product Picker */}
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] text-slate-400 mb-1">{t.colItem}:</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({language === 'ar' ? 'المتوفر بالمخزن:' : 'Stock :'} {p.quantity} {p.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-slate-400 mb-1">
                            {language === 'ar' ? 'الكمية المنقولة' : 'Quantité'} ({prod?.unit || 'u'}):
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-amber-400 font-bold"
                          />
                        </div>

                        {/* Delete line */}
                        <div className="sm:col-span-1 flex items-center justify-center pt-2 sm:pt-4">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Units Total Bar */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    {language === 'ar' ? 'إجمالي الوحدات المنقولة في الوصل:' : 'Total des unités dans ce bon :'}
                  </span>
                  <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                    {calculateTotalUnits()} {language === 'ar' ? 'وحدة' : 'unités'}
                  </span>
                </div>
              </div>

              {/* Responsible person & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t.warehouseKeeper}:</label>
                  <input
                    type="text"
                    value={warehouseKeeper}
                    onChange={(e) => setWarehouseKeeper(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'ar' ? 'المستلم الفعلي / السائق:' : 'Chauffeur / Réceptionnaire :'}
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم وتوقيع المستلم...' : 'Nom du réceptionnaire...'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'ar' ? 'ملاحظات إضافية:' : 'Observations :'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'شروط التسليم أو مطابقة الجودة...' : 'Remarques éventuelles...'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateVoucher}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-xs font-bold rounded-lg text-white shadow-md transition-colors ${
                    formVoucherType === 'RECEIPT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  {formVoucherType === 'RECEIPT' ? t.confirmReceipt : t.confirmDispatch}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Print Voucher Modal */}
      <VoucherPrintModal
        voucher={selectedVoucherForPrint}
        onClose={() => setSelectedVoucherForPrint(null)}
      />
    </div>
  );
};
