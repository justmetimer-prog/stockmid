import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Barcode,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Download,
  CheckCircle2,
  PackageX,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import { CATEGORIES_LIST } from '../utils/mockData';

interface ProductManagementViewProps {
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
}

type StockFilterType = 'ALL' | 'LOW' | 'OUT' | 'EXPIRING' | 'NORMAL';

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  onOpenAddModal,
  onEditProduct,
}) => {
  const {
    language,
    t,
    products,
    deleteProduct,
    setSelectedProductForBarcode,
    setScannedProduct,
    setIsScannerOpen,
    quickAdjustStock,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Quick adjust modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState<string>('');

  const today = new Date();

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          prod.name.toLowerCase().includes(q) ||
          prod.barcode.toLowerCase().includes(q) ||
          prod.sku.toLowerCase().includes(q) ||
          prod.location.zone.toLowerCase().includes(q) ||
          prod.supplier.toLowerCase().includes(q);

        const matchesCategory = selectedCategory === 'ALL' || prod.category === selectedCategory;

        let matchesStock = true;
        if (stockFilter === 'OUT') {
          matchesStock = prod.quantity === 0;
        } else if (stockFilter === 'LOW') {
          matchesStock = prod.quantity > 0 && prod.quantity <= prod.minQuantity;
        } else if (stockFilter === 'NORMAL') {
          matchesStock = prod.quantity > prod.minQuantity;
        } else if (stockFilter === 'EXPIRING') {
          if (!prod.expiryDate) {
            matchesStock = false;
          } else {
            const exp = new Date(prod.expiryDate);
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
            matchesStock = diffDays <= 30;
          }
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name, language === 'ar' ? 'ar' : 'fr');
        } else if (sortBy === 'quantity') {
          comparison = a.quantity - b.quantity;
        } else if (sortBy === 'date') {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy, sortOrder, today, language]);

  // Export to CSV (Zero Prices)
  const handleExportCSV = () => {
    const headers = [
      language === 'ar' ? 'اسم السلعة' : 'Article',
      language === 'ar' ? 'رمز الباركود' : 'Code-barres',
      'SKU',
      language === 'ar' ? 'التصنيف' : 'Catégorie',
      language === 'ar' ? 'الكمية الحالية' : 'Quantité',
      language === 'ar' ? 'الوحدة' : 'Unité',
      language === 'ar' ? 'حد الأمان' : 'Seuil Min',
      language === 'ar' ? 'المنطقة' : 'Zone',
      language === 'ar' ? 'الممر' : 'Allée',
      language === 'ar' ? 'الرف' : 'Rayon',
      language === 'ar' ? 'رقم الدفعة' : 'N° Lot',
      language === 'ar' ? 'تاريخ الصلاحية' : 'Expiration',
      language === 'ar' ? 'المورد' : 'Fournisseur',
    ];

    const rows = filteredProducts.map((p) => [
      `"${p.name}"`,
      `"${p.barcode}"`,
      `"${p.sku}"`,
      `"${p.category}"`,
      p.quantity,
      `"${p.unit}"`,
      p.minQuantity,
      `"${p.location.zone}"`,
      `"${p.location.aisle}"`,
      `"${p.location.shelf}"`,
      `"${p.batchNumber}"`,
      `"${p.expiryDate || '-'}"`,
      `"${p.supplier}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_logistics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExecuteQuickAdjust = () => {
    if (!adjustingProduct || adjustQty <= 0) return;
    const delta = adjustType === 'IN' ? adjustQty : -adjustQty;
    const reasonText =
      adjustReason.trim() ||
      (adjustType === 'IN'
        ? (language === 'ar' ? 'تسوية إضافة سريعة' : 'Ajustement entrée rapide')
        : (language === 'ar' ? 'تسوية صرف سريعة' : 'Ajustement sortie rapide'));
    quickAdjustStock(adjustingProduct.id, delta, reasonText);
    setAdjustingProduct(null);
    setAdjustQty(1);
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t.productsTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.productsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors whitespace-nowrap"
            title={t.exportCsv}
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.addProduct}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className={`w-4 h-4 absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 text-slate-400 pointer-events-none`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400`}
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">{t.allCategories}</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="name">{language === 'ar' ? 'ترتيب بالاسم' : 'Trier par nom'}</option>
              <option value="quantity">{language === 'ar' ? 'ترتيب بالكمية' : 'Trier par quantité'}</option>
              <option value="date">{language === 'ar' ? 'تاريخ الإضافة' : 'Date d\'ajout'}</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
              title="Direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 mx-1">{language === 'ar' ? 'حالة المخزون:' : 'État du stock :'}</span>
          
          <button
            onClick={() => setStockFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              stockFilter === 'ALL'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t.filterAll} ({products.length})
          </button>

          <button
            onClick={() => setStockFilter('LOW')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              stockFilter === 'LOW'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950/80 text-amber-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.filterLow} ({products.filter((p) => p.quantity > 0 && p.quantity <= p.minQuantity).length})</span>
          </button>

          <button
            onClick={() => setStockFilter('OUT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              stockFilter === 'OUT'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-950/80 text-rose-400 hover:text-rose-300 border border-slate-800'
            }`}
          >
            <PackageX className="w-3.5 h-3.5" />
            <span>{t.filterOut} ({products.filter((p) => p.quantity === 0).length})</span>
          </button>

          <button
            onClick={() => setStockFilter('EXPIRING')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              stockFilter === 'EXPIRING'
                ? 'bg-orange-500 text-white font-bold'
                : 'bg-slate-950/80 text-orange-400 hover:text-orange-300 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.filterExpiring}</span>
          </button>

          <button
            onClick={() => setStockFilter('NORMAL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              stockFilter === 'NORMAL'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-950/80 text-emerald-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.filterNormal}</span>
          </button>
        </div>
      </div>

      {/* Data Table (Without Prices) */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800 text-[11px] font-medium tracking-wider">
              <tr>
                <th className="py-3 px-4">{t.colItem}</th>
                <th className="py-3 px-4">{t.colCategory}</th>
                <th className="py-3 px-4">{t.colLocation}</th>
                <th className="py-3 px-4 text-center">{t.colQuantity}</th>
                <th className="py-3 px-4">{t.colBatchExpiry}</th>
                <th className="py-3 px-4 text-center">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">
                      {language === 'ar' ? 'لم يتم العثور على أي منتج مطابق لمعايير البحث' : 'Aucun article trouvé selon vos critères'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.quantity === 0;
                  const isLowStock = product.quantity > 0 && product.quantity <= product.minQuantity;

                  // Expiry calculations
                  let expiryLabel = language === 'ar' ? 'غير محدد' : 'Non spécifié';
                  let isExpiringSoon = false;
                  let isExpired = false;
                  if (product.expiryDate) {
                    const exp = new Date(product.expiryDate);
                    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    if (diffDays < 0) {
                      isExpired = true;
                      expiryLabel = language === 'ar' ? `منتهي منذ ${Math.abs(diffDays)} يوم` : `Expiré il y a ${Math.abs(diffDays)} j`;
                    } else if (diffDays <= 30) {
                      isExpiringSoon = true;
                      expiryLabel = language === 'ar' ? `متبقي ${diffDays} يوم` : `Reste ${diffDays} j`;
                    } else {
                      expiryLabel = product.expiryDate;
                    }
                  }

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Product Name & Barcode */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-sm line-clamp-1">
                          {product.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-slate-400 font-mono text-[11px] tabular-nums">
                          <span className="text-amber-400/90 font-medium">{product.barcode}</span>
                          <span>·</span>
                          <span className="text-slate-500">{product.sku}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="text-xs">{product.category}</span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setScannedProduct(product);
                            setIsScannerOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-300 transition-colors text-right rtl:text-right ltr:text-left"
                          title="Localiser sur le plan"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold block text-[11px] text-white">
                              {product.location.zone}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.aisle} {product.location.aisle} · {t.shelfRack} {product.location.shelf} · {t.bin} {product.location.bin}
                            </span>
                          </div>
                        </button>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-mono font-bold text-base tabular-nums ${
                              isOutOfStock
                                ? 'text-rose-400'
                                : isLowStock
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {product.quantity.toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {product.unit} ({t.safeMinQty}: {product.minQuantity})
                          </span>
                        </div>
                      </td>

                      {/* Expiry & Batch */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`text-xs font-mono tabular-nums ${
                            isExpired
                              ? 'text-rose-400 font-bold'
                              : isExpiringSoon
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {expiryLabel}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {language === 'ar' ? 'الدفعة:' : 'Lot :'} {product.batchNumber || '-'}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Barcode Label */}
                          <button
                            onClick={() => setSelectedProductForBarcode(product)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                            title={t.printSticker}
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Quick Adjust Quantity */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setAdjustQty(1);
                              setAdjustType('IN');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                            title={t.quickAdjust}
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title={t.editProduct}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (window.confirm(language === 'ar' ? `هل أنت متأكد من حذف المنتج "${product.name}" نهائياً؟` : `Supprimer l'article "${product.name}" ?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                            title={t.deleteProduct}
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

        {/* Table summary footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {language === 'ar' ? 'عرض' : 'Affichage'} <strong className="text-white font-mono">{filteredProducts.length}</strong> {language === 'ar' ? 'من إجمالي' : 'sur'}{' '}
            <strong className="text-white font-mono">{products.length}</strong> {language === 'ar' ? 'صنف' : 'articles'}
          </span>
          <span className="font-mono tabular-nums">
            {language === 'ar' ? 'إجمالي رصيد الأصناف المعروضة:' : 'Total unités affichées :'}{' '}
            <strong className="text-amber-400 font-bold">
              {filteredProducts.reduce((sum, p) => sum + p.quantity, 0).toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')} {language === 'ar' ? 'وحدة' : 'unités'}
            </strong>
          </span>
        </div>
      </div>

      {/* Quick Adjust Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-right rtl:text-right ltr:text-left space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{t.quickAdjust}</h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">{adjustingProduct.name}</p>
              <p className="text-xs text-slate-400 font-mono">
                {language === 'ar' ? 'الرصيد الحالي:' : 'Stock actuel :'} <strong className="text-amber-400">{adjustingProduct.quantity}</strong> {adjustingProduct.unit}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('IN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  adjustType === 'IN'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة للمستودع (+)' : 'Entrée (+)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustType('OUT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  adjustType === 'OUT'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{language === 'ar' ? 'صرف من المستودع (-)' : 'Sortie (-)'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ar' ? 'الكمية المراد تعديلها:' : 'Quantité :'}
              </label>
              <input
                type="number"
                min="1"
                max={adjustType === 'OUT' ? adjustingProduct.quantity : 999999}
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-center text-lg font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'ar' ? 'سبب الحركة / الملاحظات:' : 'Motif / Remarque :'}
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: تسوية جرد عاجل، صرف داخلي...' : 'Ex: Ajustement périodique...'}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickAdjust}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm"
              >
                {language === 'ar' ? 'تأكيد التعديل' : 'Valider l\'ajustement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
