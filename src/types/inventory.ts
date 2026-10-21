export type StockMovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';

export type VoucherType = 'RECEIPT' | 'DISPATCH'; // RECEIPT = وصل استلام (Bon de réception), DISPATCH = وصل إخراج (Bon de sortie)

export interface WarehouseLocation {
  zone: string;    // e.g. "A - الآلات والمحركات", "B - العدد والمستهلكات", "C - السوائل", "D - البضائع الضخمة"
  aisle: string;   // ممر: "01", "02", "03"
  shelf: string;   // رف: "A-1", "B-2", "C-3"
  bin: string;     // صندوق/مستوى: "01", "02", "04"
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  quantity: number;
  minQuantity: number;      // حد الأمان الأدنى
  unit: string;             // قطعة، كرتون، كغ، متر، طقم، لتر
  location: WarehouseLocation;
  batchNumber: string;      // رقم الدفعة / التشغيلة
  productionDate?: string;  // تاريخ الإنتاج
  expiryDate?: string;      // تاريخ انتهاء الصلاحية (YYYY-MM-DD)
  supplier: string;         // المورد الرئيسي
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherItem {
  productId: string;
  productName: string;
  barcode: string;
  sku: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
  location?: WarehouseLocation;
}

export interface MovementVoucher {
  id: string;
  type: VoucherType;
  voucherNumber: string;    // e.g. "REC-2026-104" or "DIS-2026-088"
  date: string;
  partyName: string;        // المورد أو المستلم
  partyContact?: string;    // هاتف أو جهة الاتصال
  referenceDoc: string;     // رقم الفاتورة أو رقم أمر الصرف
  items: VoucherItem[];
  totalQuantity: number;    // إجمالي عدد الوحدات المنقولة
  notes?: string;
  warehouseKeeper: string;  // اسم أمين المستودع المسؤول
  receivedBy?: string;      // المستلم (لإخراج البضاعة)
  status: 'CONFIRMED' | 'DRAFT' | 'CANCELLED';
  createdAt: string;
}

export type AlertSeverity = 'danger' | 'warning' | 'info';
export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  currentQty: number;
  minQty?: number;
  expiryDate?: string;
  daysRemaining?: number;
  location: WarehouseLocation;
}

export interface StockMovementHistory {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  voucherNumber?: string;
  quantityChanged: number;
  balanceAfter: number;
  date: string;
  reason: string;
  user: string;
}
