import { Product, MovementVoucher, StockMovementHistory } from '../types/inventory';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'محرك كهربائي صناعي 3 فاز 5.5 حصان',
    sku: 'MOT-3PH-55HP',
    barcode: '6281002938101',
    category: 'معدات كهربائية ومحركات',
    quantity: 14,
    minQuantity: 5,
    unit: 'قطعة',
    location: {
      zone: 'المنطقة A - الآلات الثقيلة',
      aisle: '01',
      shelf: 'A-1',
      bin: '04'
    },
    batchNumber: 'LOT-2026-A10',
    productionDate: '2025-11-15',
    expiryDate: '2030-11-15',
    supplier: 'شركة الصناعات الكهربائية المتقدمة',
    notes: 'تخزين في مكان جاف ومحمي من الرطوبة',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-12T10:30:00Z'
  },
  {
    id: 'prod-002',
    name: 'مضخة هيدروليكية عالية الضغط 250 بار',
    sku: 'HYD-PUMP-250B',
    barcode: '6281002938102',
    category: 'أنظمة هيدروليكية',
    quantity: 3,
    minQuantity: 6, // LOW STOCK ALERT
    unit: 'قطعة',
    location: {
      zone: 'المنطقة A - الآلات الثقيلة',
      aisle: '02',
      shelf: 'A-2',
      bin: '01'
    },
    batchNumber: 'LOT-2026-H44',
    productionDate: '2025-08-01',
    expiryDate: '2032-08-01',
    supplier: 'مؤسسة الدقة الهيدروليكية',
    notes: 'تحتاج فحص زيت أولي قبل الإخراج',
    createdAt: '2026-01-12T09:15:00Z',
    updatedAt: '2026-03-18T14:20:00Z'
  },
  {
    id: 'prod-003',
    name: 'زيت هيدروليكي صناعي ISO VG 46 (برميل 200 لتر)',
    sku: 'OIL-ISO-46-200L',
    barcode: '6281002938103',
    category: 'زيوت ومواد تشحيم',
    quantity: 8,
    minQuantity: 10, // LOW STOCK
    unit: 'برميل',
    location: {
      zone: 'المنطقة C - السوائل والمواد الكيميائية',
      aisle: '01',
      shelf: 'C-1',
      bin: '02'
    },
    batchNumber: 'LOT-2025-Z90',
    productionDate: '2024-11-01',
    expiryDate: '2026-11-05', // Expiring in ~16 days
    supplier: 'بتروكيم للزيوت الصناعية',
    notes: 'تخزين في منطقة جيدة التهوية ومجهزة بحوض احتواء',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-03-20T16:45:00Z'
  },
  {
    id: 'prod-004',
    name: 'معجون لحام حراري سريع التصلب 500 مل',
    sku: 'PASTE-THERM-500',
    barcode: '6281002938104',
    category: 'مواد استهلاكية ولحام',
    quantity: 28,
    minQuantity: 15,
    unit: 'علبة',
    location: {
      zone: 'المنطقة B - العدد والمستهلكات',
      aisle: '03',
      shelf: 'B-3',
      bin: '12'
    },
    batchNumber: 'LOT-2026-CHEM01',
    productionDate: '2025-10-10',
    expiryDate: '2026-10-31', // EXPIRING SOON
    supplier: 'شركة اللحام الحديث',
    notes: 'حساس لدرجات الحرارة المرتفعة، احفظ دون 25 درجة مئوية',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-005',
    name: 'حزام ناقل مطاطي معزز بالألياف 10 أمتار',
    sku: 'BELT-CONV-10M',
    barcode: '6281002938105',
    category: 'سيور وسيور ناقلة',
    quantity: 0, // OUT OF STOCK
    minQuantity: 4,
    unit: 'لفة',
    location: {
      zone: 'المنطقة D - البضائع الضخمة والسيور',
      aisle: '01',
      shelf: 'D-1',
      bin: '05'
    },
    batchNumber: 'LOT-2025-B77',
    productionDate: '2025-05-12',
    expiryDate: '2030-05-12',
    supplier: 'مصنع السيور العربية',
    notes: 'نفدت الكمية تماماً - تم طلب توريد جديد',
    createdAt: '2026-02-10T13:00:00Z',
    updatedAt: '2026-03-22T08:10:00Z'
  },
  {
    id: 'prod-006',
    name: 'محامل كروية ألمانية مقاومة للاحتكاك SKF 6208',
    sku: 'BEAR-SKF-6208',
    barcode: '6281002938106',
    category: 'محامل ورولمان بلي',
    quantity: 45,
    minQuantity: 20,
    unit: 'قطعة',
    location: {
      zone: 'المنطقة B - العدد والمستهلكات',
      aisle: '01',
      shelf: 'B-1',
      bin: '08'
    },
    batchNumber: 'LOT-2026-SKF04',
    productionDate: '2025-09-01',
    expiryDate: '2035-09-01',
    supplier: 'شركة التوريدات الهندسية العالمية',
    notes: 'مغلفة بطبقة شحم واقية ضد الصدأ',
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-03-24T15:00:00Z'
  },
  {
    id: 'prod-007',
    name: 'محبس فراشة هوائي كروي من الستانلس ستيل 3 بوصة',
    sku: 'VALVE-SS-3INCH',
    barcode: '6281002938107',
    category: 'صمامات وأنابيب',
    quantity: 19,
    minQuantity: 8,
    unit: 'قطعة',
    location: {
      zone: 'المنطقة B - العدد والمستهلكات',
      aisle: '02',
      shelf: 'B-2',
      bin: '03'
    },
    batchNumber: 'LOT-2026-V32',
    productionDate: '2026-01-05',
    expiryDate: '2036-01-05',
    supplier: 'مصنع الصمامات الدقيقة',
    notes: 'معتمد للمواصفات الغذائية والصناعية',
    createdAt: '2026-02-20T11:45:00Z',
    updatedAt: '2026-03-25T11:00:00Z'
  },
  {
    id: 'prod-008',
    name: 'حساس حرارة وليزر ليزري صناعي PT100 مع كابل 5 م',
    sku: 'SENS-TEMP-PT100',
    barcode: '6281002938108',
    category: 'أجهزة قياس وحساسات',
    quantity: 2,
    minQuantity: 5, // LOW STOCK
    unit: 'طقم',
    location: {
      zone: 'المنطقة B - العدد والمستهلكات',
      aisle: '04',
      shelf: 'B-4',
      bin: '15'
    },
    batchNumber: 'LOT-2026-SEN9',
    productionDate: '2026-02-10',
    expiryDate: '2031-02-10',
    supplier: 'التقنيات المتطورة للاستشعار',
    notes: 'حساس إلكتروني دقيق - يرجى التعامل بعناية',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-26T17:00:00Z'
  }
];

export const INITIAL_VOUCHERS: MovementVoucher[] = [
  {
    id: 'vouc-001',
    type: 'RECEIPT',
    voucherNumber: 'REC-2026-0038',
    date: '2026-10-18',
    partyName: 'شركة الصناعات الكهربائية المتقدمة',
    partyContact: '+966 50 123 4567',
    referenceDoc: 'إذن توريد رقم BL-9921',
    warehouseKeeper: 'المهندس أحمد المنصور',
    receivedBy: 'أمين المستودع المركزي',
    status: 'CONFIRMED',
    notes: 'تم فحص الشحنة ومطابقتها للمواصفات الفنية المعتمدة وتسكينها على الأرفف',
    items: [
      {
        productId: 'prod-001',
        productName: 'محرك كهربائي صناعي 3 فاز 5.5 حصان',
        barcode: '6281002938101',
        sku: 'MOT-3PH-55HP',
        quantity: 5,
        unit: 'قطعة',
        batchNumber: 'LOT-2026-A10',
        location: { zone: 'المنطقة A', aisle: '01', shelf: 'A-1', bin: '04' }
      },
      {
        productId: 'prod-006',
        productName: 'محامل كروية ألمانية مقاومة للاحتكاك SKF 6208',
        barcode: '6281002938106',
        sku: 'BEAR-SKF-6208',
        quantity: 20,
        unit: 'قطعة',
        batchNumber: 'LOT-2026-SKF04',
        location: { zone: 'المنطقة B', aisle: '01', shelf: 'B-1', bin: '08' }
      }
    ],
    totalQuantity: 25,
    createdAt: '2026-10-18T09:30:00Z'
  },
  {
    id: 'vouc-002',
    type: 'DISPATCH',
    voucherNumber: 'DIS-2026-0045',
    date: '2026-10-19',
    partyName: 'مصنع الأمل للصناعات البلاستيكية',
    partyContact: '+966 55 987 6543',
    referenceDoc: 'طلب صرف رقم SO-4082',
    warehouseKeeper: 'المهندس أحمد المنصور',
    receivedBy: 'سائق النقل / طارق السعيد',
    status: 'CONFIRMED',
    notes: 'تم صرف المواد بموجب إذن الصرف المعتمد من الإدارة الفنية',
    items: [
      {
        productId: 'prod-001',
        productName: 'محرك كهربائي صناعي 3 فاز 5.5 حصان',
        barcode: '6281002938101',
        sku: 'MOT-3PH-55HP',
        quantity: 2,
        unit: 'قطعة',
        batchNumber: 'LOT-2026-A10',
        location: { zone: 'المنطقة A', aisle: '01', shelf: 'A-1', bin: '04' }
      },
      {
        productId: 'prod-007',
        productName: 'محبس فراشة هوائي كروي من الستانلس ستيل 3 بوصة',
        barcode: '6281002938107',
        sku: 'VALVE-SS-3INCH',
        quantity: 3,
        unit: 'قطعة',
        batchNumber: 'LOT-2026-V32',
        location: { zone: 'المنطقة B', aisle: '02', shelf: 'B-2', bin: '03' }
      }
    ],
    totalQuantity: 5,
    createdAt: '2026-10-19T14:15:00Z'
  }
];

export const INITIAL_MOVEMENTS: StockMovementHistory[] = [
  {
    id: 'mov-1',
    productId: 'prod-001',
    productName: 'محرك كهربائي صناعي 3 فاز 5.5 حصان',
    type: 'INBOUND',
    voucherNumber: 'REC-2026-0038',
    quantityChanged: 5,
    balanceAfter: 16,
    date: '2026-10-18T09:30:00Z',
    reason: 'توريد دفعة جديدة من المورد',
    user: 'أحمد المنصور'
  },
  {
    id: 'mov-2',
    productId: 'prod-006',
    productName: 'محامل كروية ألمانية مقاومة للاحتكاك SKF 6208',
    type: 'INBOUND',
    voucherNumber: 'REC-2026-0038',
    quantityChanged: 20,
    balanceAfter: 45,
    date: '2026-10-18T09:30:00Z',
    reason: 'توريد دفعة دورية',
    user: 'أحمد المنصور'
  },
  {
    id: 'mov-3',
    productId: 'prod-001',
    productName: 'محرك كهربائي صناعي 3 فاز 5.5 حصان',
    type: 'OUTBOUND',
    voucherNumber: 'DIS-2026-0045',
    quantityChanged: -2,
    balanceAfter: 14,
    date: '2026-10-19T14:15:00Z',
    reason: 'صرف بموجب طلب صيانة مصنع الأمل',
    user: 'أحمد المنصور'
  },
  {
    id: 'mov-4',
    productId: 'prod-007',
    productName: 'محبس فراشة هوائي كروي من الستانلس ستيل 3 بوصة',
    type: 'OUTBOUND',
    voucherNumber: 'DIS-2026-0045',
    quantityChanged: -3,
    balanceAfter: 19,
    date: '2026-10-19T14:15:00Z',
    reason: 'صرف لمشروع الخط الجديد',
    user: 'أحمد المنصور'
  }
];

export const CATEGORIES_LIST = [
  'معدات كهربائية ومحركات',
  'أنظمة هيدروليكية',
  'زيوت ومواد تشحيم',
  'مواد استهلاكية ولحام',
  'سيور وسيور ناقلة',
  'محامل ورولمان بلي',
  'صمامات وأنابيب',
  'أجهزة قياس وحساسات',
  'قطع غيار عامة'
];

export const WAREHOUSE_ZONES = [
  { id: 'A', name: 'المنطقة A', title: 'الآلات الثقيلة والمحركات', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'B', name: 'المنطقة B', title: 'العدد والمستهلكات والقطع الدقيقة', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'C', name: 'المنطقة C', title: 'السوائل والمواد الكيميائية والزيوت', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'D', name: 'المنطقة D', title: 'البضائع الضخمة والسيور والأطقم', color: 'border-purple-500/30 bg-purple-500/5' }
];
