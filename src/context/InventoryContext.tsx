import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  MovementVoucher,
  StockMovementHistory,
  StockAlert,
  VoucherType,
} from '../types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_VOUCHERS,
  INITIAL_MOVEMENTS,
} from '../utils/mockData';
import { Language, translations } from '../i18n/translations';

interface InventoryContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['ar'];

  products: Product[];
  vouchers: MovementVoucher[];
  movements: StockMovementHistory[];
  alerts: StockAlert[];
  
  // Product Operations
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  quickAdjustStock: (productId: string, quantityDiff: number, reason: string) => void;

  // Voucher Operations
  createVoucher: (voucher: Omit<MovementVoucher, 'id' | 'createdAt'>) => MovementVoucher;
  deleteVoucher: (id: string) => void;

  // Modal / Interaction States
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  scannedProduct: Product | null;
  setScannedProduct: (product: Product | null) => void;
  
  selectedProductForBarcode: Product | null;
  setSelectedProductForBarcode: (product: Product | null) => void;
  
  selectedVoucherForPrint: MovementVoucher | null;
  setSelectedVoucherForPrint: (voucher: MovementVoucher | null) => void;
  
  isCreateVoucherOpen: boolean;
  openCreateVoucher: (type?: VoucherType) => void;
  closeCreateVoucher: () => void;
  activeVoucherType: VoucherType;

  isAlertsDrawerOpen: boolean;
  setIsAlertsDrawerOpen: (open: boolean) => void;

  resetToDemoData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'makhzoon_products_v2',
  VOUCHERS: 'makhzoon_vouchers_v2',
  MOVEMENTS: 'makhzoon_movements_v2',
  LANGUAGE: 'makhzoon_lang_v1',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language state (default Arabic, switchable to French)
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
      return saved === 'fr' ? 'fr' : 'ar';
    } catch {
      return 'ar';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (e) {
      console.error(e);
    }
  };

  // Sync document direction and lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = translations[language];

  // Load products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Load vouchers
  const [vouchers, setVouchers] = useState<MovementVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
      return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
    } catch {
      return INITIAL_VOUCHERS;
    }
  });

  // Load movements history
  const [movements, setMovements] = useState<StockMovementHistory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<MovementVoucher | null>(null);
  
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [activeVoucherType, setActiveVoucherType] = useState<VoucherType>('RECEIPT');
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
    } catch (e) {
      console.error('Failed to save vouchers:', e);
    }
  }, [vouchers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error('Failed to save movements:', e);
    }
  }, [movements]);

  // Compute live alerts (Low stock & Expiry)
  const alerts = useMemo<StockAlert[]>(() => {
    const list: StockAlert[] = [];
    const today = new Date();

    products.forEach((prod) => {
      // 1. Out of stock alert
      if (prod.quantity === 0) {
        list.push({
          id: `alert-out-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          type: 'OUT_OF_STOCK',
          severity: 'danger',
          message: language === 'ar'
            ? `نفدت كمية السلعة تماماً من المستودع!`
            : `Rupture totale de stock dans l'entrepôt !`,
          currentQty: 0,
          minQty: prod.minQuantity,
          location: prod.location,
        });
      } 
      // 2. Low stock alert
      else if (prod.quantity <= prod.minQuantity) {
        list.push({
          id: `alert-low-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          type: 'LOW_STOCK',
          severity: 'warning',
          message: language === 'ar'
            ? `الكمية المتوفرة (${prod.quantity} ${prod.unit}) وصلت إلى حد الأمان الأدنى (${prod.minQuantity})`
            : `Quantité restante (${prod.quantity} ${prod.unit}) au seuil critique minimal (${prod.minQuantity})`,
          currentQty: prod.quantity,
          minQty: prod.minQuantity,
          location: prod.location,
        });
      }

      // 3. Expiry date check
      if (prod.expiryDate) {
        const expDate = new Date(prod.expiryDate);
        const diffMs = expDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          list.push({
            id: `alert-exp-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            barcode: prod.barcode,
            type: 'EXPIRED',
            severity: 'danger',
            message: language === 'ar'
              ? `انتهت صلاحية السلعة منذ ${Math.abs(daysRemaining)} يوم (تاريخ الانتهاء: ${prod.expiryDate})`
              : `Article expiré depuis ${Math.abs(daysRemaining)} jours (Date : ${prod.expiryDate})`,
            currentQty: prod.quantity,
            expiryDate: prod.expiryDate,
            daysRemaining,
            location: prod.location,
          });
        } else if (daysRemaining <= 30) {
          list.push({
            id: `alert-expsoon-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            barcode: prod.barcode,
            type: 'EXPIRING_SOON',
            severity: daysRemaining <= 7 ? 'danger' : 'warning',
            message: language === 'ar'
              ? `تقترب صلاحية السلعة من الانتهاء خلال ${daysRemaining} يوم (تاريخ الانتهاء: ${prod.expiryDate})`
              : `Date d'expiration proche dans ${daysRemaining} jours (Date : ${prod.expiryDate})`,
            currentQty: prod.quantity,
            expiryDate: prod.expiryDate,
            daysRemaining,
            location: prod.location,
          });
        }
      }
    });

    return list;
  }, [products, language]);

  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Record initial movement
    if (newProduct.quantity > 0) {
      const initialMovement: StockMovementHistory = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'ADJUSTMENT',
        quantityChanged: newProduct.quantity,
        balanceAfter: newProduct.quantity,
        date: now,
        reason: language === 'ar' ? 'إدخال رصيد أولي لمنتج جديد' : 'Saisie du stock initial',
        user: language === 'ar' ? 'أمين المستودع' : 'Magasinier',
      };
      setMovements((prev) => [initialMovement, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === id
          ? { ...prod, ...updates, updatedAt: new Date().toISOString() }
          : prod
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getProductByBarcode = (barcode: string): Product | undefined => {
    const clean = barcode.trim();
    return products.find(
      (p) => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase()
    );
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  const quickAdjustStock = (productId: string, quantityDiff: number, reason: string) => {
    setProducts((prev) => {
      return prev.map((p) => {
        if (p.id === productId) {
          const newQty = Math.max(0, p.quantity + quantityDiff);
          
          // Log movement
          const newMovement: StockMovementHistory = {
            id: `mov-${Date.now()}`,
            productId: p.id,
            productName: p.name,
            type: quantityDiff > 0 ? 'INBOUND' : 'OUTBOUND',
            quantityChanged: quantityDiff,
            balanceAfter: newQty,
            date: new Date().toISOString(),
            reason,
            user: language === 'ar' ? 'أمين المستودع' : 'Magasinier',
          };
          setMovements((m) => [newMovement, ...m]);

          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      });
    });
  };

  const createVoucher = (voucherData: Omit<MovementVoucher, 'id' | 'createdAt'>): MovementVoucher => {
    const now = new Date().toISOString();
    const newVoucher: MovementVoucher = {
      ...voucherData,
      id: `vouc-${Date.now()}`,
      createdAt: now,
    };

    // If confirmed, update product stock levels automatically!
    if (newVoucher.status === 'CONFIRMED') {
      const isInbound = newVoucher.type === 'RECEIPT';
      
      setProducts((currentProducts) => {
        return currentProducts.map((prod) => {
          const voucherItem = newVoucher.items.find((item) => item.productId === prod.id);
          if (!voucherItem) return prod;

          const change = isInbound ? voucherItem.quantity : -voucherItem.quantity;
          const updatedQty = Math.max(0, prod.quantity + change);

          // Record movement
          const mov: StockMovementHistory = {
            id: `mov-${Date.now()}-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            type: isInbound ? 'INBOUND' : 'OUTBOUND',
            voucherNumber: newVoucher.voucherNumber,
            quantityChanged: change,
            balanceAfter: updatedQty,
            date: newVoucher.date || now,
            reason: isInbound
              ? (language === 'ar' ? `وصل استلام (${newVoucher.voucherNumber}) - مورد: ${newVoucher.partyName}` : `Bon de réception (${newVoucher.voucherNumber}) - Fournisseur: ${newVoucher.partyName}`)
              : (language === 'ar' ? `وصل إخراج (${newVoucher.voucherNumber}) - مستلم: ${newVoucher.partyName}` : `Bon de sortie (${newVoucher.voucherNumber}) - Destinataire: ${newVoucher.partyName}`),
            user: newVoucher.warehouseKeeper,
          };
          setMovements((m) => [mov, ...m]);

          return {
            ...prod,
            quantity: updatedQty,
            updatedAt: now,
          };
        });
      });
    }

    setVouchers((prev) => [newVoucher, ...prev]);
    return newVoucher;
  };

  const deleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  const openCreateVoucher = (type: VoucherType = 'RECEIPT') => {
    setActiveVoucherType(type);
    setIsCreateVoucherOpen(true);
  };

  const closeCreateVoucher = () => {
    setIsCreateVoucherOpen(false);
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setVouchers(INITIAL_VOUCHERS);
    setMovements(INITIAL_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.VOUCHERS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
  };

  return (
    <InventoryContext.Provider
      value={{
        language,
        setLanguage,
        t,
        products,
        vouchers,
        movements,
        alerts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductByBarcode,
        getProductById,
        quickAdjustStock,
        createVoucher,
        deleteVoucher,
        isScannerOpen,
        setIsScannerOpen,
        scannedProduct,
        setScannedProduct,
        selectedProductForBarcode,
        setSelectedProductForBarcode,
        selectedVoucherForPrint,
        setSelectedVoucherForPrint,
        isCreateVoucherOpen,
        openCreateVoucher,
        closeCreateVoucher,
        activeVoucherType,
        isAlertsDrawerOpen,
        setIsAlertsDrawerOpen,
        resetToDemoData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
