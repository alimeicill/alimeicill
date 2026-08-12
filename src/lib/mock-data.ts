import type {
  User,
  Tenant,
  Unit,
  Invoice,
  InvoiceItem,
  Payment,
  Task,
  Document,
  Notification,
  MeterReading,
  DashboardStats,
  Widget,
  FinancialAccount,
  MonthlyFinance,
} from '@/types';

// ============================================================
// Constants
// ============================================================
const TENANT_ID = 'tenant-001';

// ============================================================
// Tenant (Site)
// ============================================================
export const mockTenant: Tenant = {
  id: TENANT_ID,
  name: 'Yıldız Konakları Sitesi',
  address: 'Yıldız Mah. Çamlık Cad. No:42',
  city: 'İstanbul',
  district: 'Beşiktaş',
  totalUnits: 20,
  totalBlocks: 2,
  settings: {
    currency: 'TRY',
    language: 'tr',
    lateFeePercentage: 5,
    lateFeeGraceDays: 15,
    fiscalYearStart: '01',
    defaultDueDayOfMonth: 15,
    enableSms: true,
    enableEmail: true,
  },
  createdAt: '2025-01-15T10:00:00Z',
};

export const mockTenants: Tenant[] = [mockTenant];

// ============================================================
// Users (15)
// ============================================================
export const mockUsers: User[] = [
  // Site Manager
  {
    id: 'user-001',
    name: 'Hasan Korkmaz',
    email: 'hasan.korkmaz@yildizkonaklari.com',
    role: 'site_manager',
    avatar: '/avatars/hasan.jpg',
    phone: '+90 532 111 22 33',
    tenantId: TENANT_ID,
    createdAt: '2025-01-15T10:00:00Z',
  },
  // Accountant
  {
    id: 'user-002',
    name: 'Zeynep Arslan',
    email: 'zeynep.arslan@yildizkonaklari.com',
    role: 'accountant',
    avatar: '/avatars/zeynep.jpg',
    phone: '+90 533 222 33 44',
    tenantId: TENANT_ID,
    createdAt: '2025-02-01T09:00:00Z',
  },
  // Block Rep – A Blok
  {
    id: 'user-003',
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@gmail.com',
    role: 'block_rep',
    phone: '+90 535 333 44 55',
    unitId: 'unit-A101',
    tenantId: TENANT_ID,
    createdAt: '2025-02-10T08:00:00Z',
  },
  // Owners & Tenants
  {
    id: 'user-004',
    name: 'Fatma Kaya',
    email: 'fatma.kaya@hotmail.com',
    role: 'owner',
    phone: '+90 536 444 55 66',
    unitId: 'unit-A102',
    tenantId: TENANT_ID,
    createdAt: '2025-02-15T08:00:00Z',
  },
  {
    id: 'user-005',
    name: 'Mehmet Demir',
    email: 'mehmet.demir@gmail.com',
    role: 'owner',
    phone: '+90 537 555 66 77',
    unitId: 'unit-A201',
    tenantId: TENANT_ID,
    createdAt: '2025-02-15T08:30:00Z',
  },
  {
    id: 'user-006',
    name: 'Ayşe Çelik',
    email: 'ayse.celik@outlook.com',
    role: 'tenant',
    phone: '+90 538 666 77 88',
    unitId: 'unit-A202',
    tenantId: TENANT_ID,
    createdAt: '2025-03-01T09:00:00Z',
  },
  {
    id: 'user-007',
    name: 'Mustafa Öztürk',
    email: 'mustafa.ozturk@gmail.com',
    role: 'owner',
    phone: '+90 539 777 88 99',
    unitId: 'unit-A301',
    tenantId: TENANT_ID,
    createdAt: '2025-03-05T10:00:00Z',
  },
  {
    id: 'user-008',
    name: 'Elif Şahin',
    email: 'elif.sahin@gmail.com',
    role: 'owner',
    phone: '+90 541 888 99 00',
    unitId: 'unit-A302',
    tenantId: TENANT_ID,
    createdAt: '2025-03-10T11:00:00Z',
  },
  {
    id: 'user-009',
    name: 'Ali Yıldırım',
    email: 'ali.yildirim@hotmail.com',
    role: 'owner',
    phone: '+90 542 999 00 11',
    unitId: 'unit-B101',
    tenantId: TENANT_ID,
    createdAt: '2025-03-12T08:00:00Z',
  },
  {
    id: 'user-010',
    name: 'Hatice Aydın',
    email: 'hatice.aydin@gmail.com',
    role: 'tenant',
    phone: '+90 543 100 11 22',
    unitId: 'unit-B102',
    tenantId: TENANT_ID,
    createdAt: '2025-03-15T09:00:00Z',
  },
  {
    id: 'user-011',
    name: 'İbrahim Koç',
    email: 'ibrahim.koc@outlook.com',
    role: 'owner',
    phone: '+90 544 200 22 33',
    unitId: 'unit-B201',
    tenantId: TENANT_ID,
    createdAt: '2025-03-18T10:00:00Z',
  },
  {
    id: 'user-012',
    name: 'Merve Aksoy',
    email: 'merve.aksoy@gmail.com',
    role: 'owner',
    phone: '+90 545 300 33 44',
    unitId: 'unit-B202',
    tenantId: TENANT_ID,
    createdAt: '2025-03-20T11:00:00Z',
  },
  {
    id: 'user-013',
    name: 'Emre Polat',
    email: 'emre.polat@gmail.com',
    role: 'tenant',
    phone: '+90 546 400 44 55',
    unitId: 'unit-B301',
    tenantId: TENANT_ID,
    createdAt: '2025-04-01T08:00:00Z',
  },
  {
    id: 'user-014',
    name: 'Selin Erdoğan',
    email: 'selin.erdogan@hotmail.com',
    role: 'owner',
    phone: '+90 547 500 55 66',
    unitId: 'unit-A401',
    tenantId: TENANT_ID,
    createdAt: '2025-04-05T09:00:00Z',
  },
  {
    id: 'user-015',
    name: 'Burak Çetinkaya',
    email: 'burak.cetinkaya@gmail.com',
    role: 'owner',
    phone: '+90 548 600 66 77',
    unitId: 'unit-B401',
    tenantId: TENANT_ID,
    createdAt: '2025-04-10T10:00:00Z',
  },
];

// ============================================================
// Units (20) – A Blok & B Blok, 5 floors, 2 per floor
// ============================================================
export const mockUnits: Unit[] = [
  // ---- A Blok ----
  { 
    id: 'unit-A101', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 1, 
    number: 'A-101', 
    areaSqm: 120, 
    ownershipShare: 5, 
    ownerId: 'user-003', 
    ownerName: 'Ahmet Yılmaz', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '3+1',
    emergencyName: 'Canan Yılmaz',
    emergencyPhone: '+90 532 999 88 77',
    vehicles: ['34 ABC 123'],
    pets: ['Pamuk (Kedi)'],
    residentHistory: [
      { date: '2024-05-10', action: 'Giriş', resident: 'Ahmet Yılmaz (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A102', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 1, 
    number: 'A-102', 
    areaSqm: 95,  
    ownershipShare: 4, 
    ownerId: 'user-004', 
    ownerName: 'Fatma Kaya', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Kamil Kaya',
    emergencyPhone: '+90 535 777 66 55',
    vehicles: [],
    pets: [],
    residentHistory: [
      { date: '2023-11-12', action: 'Giriş', resident: 'Fatma Kaya (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A201', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 2, 
    number: 'A-201', 
    areaSqm: 130, 
    ownershipShare: 6, 
    ownerId: 'user-005', 
    ownerName: 'Mehmet Demir', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '3+1',
    emergencyName: 'Selin Demir',
    emergencyPhone: '+90 536 888 22 11',
    vehicles: ['34 DEF 456'],
    pets: ['Karabaş (Köpek)'],
    residentHistory: [
      { date: '2025-01-20', action: 'Giriş', resident: 'Mehmet Demir (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A202', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 2, 
    number: 'A-202', 
    areaSqm: 110, 
    ownershipShare: 5, 
    ownerId: undefined, 
    ownerName: 'Kemal Güneş', 
    tenantName: 'Ayşe Çelik', 
    status: 'occupied', 
    type: 'residential',
    rooms: '2.5+1',
    emergencyName: 'Mustafa Çelik',
    emergencyPhone: '+90 544 555 44 33',
    vehicles: ['06 ANK 99'],
    pets: [],
    residentHistory: [
      { date: '2025-03-01', action: 'Kiralama', resident: 'Ayşe Çelik (Kiracı)' },
      { date: '2024-02-15', action: 'Ayrılma', resident: 'Orhan Şen (Eski Kiracı)' }
    ]
  },
  { 
    id: 'unit-A301', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 3, 
    number: 'A-301', 
    areaSqm: 140, 
    ownershipShare: 6, 
    ownerId: 'user-007', 
    ownerName: 'Mustafa Öztürk', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '4+1',
    emergencyName: 'Emre Öztürk',
    emergencyPhone: '+90 533 111 00 22',
    vehicles: ['34 XYZ 789', '34 KKM 12'],
    pets: ['Boncuk (Kuş)'],
    residentHistory: [
      { date: '2024-06-01', action: 'Giriş', resident: 'Mustafa Öztürk (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A302', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 3, 
    number: 'A-302', 
    areaSqm: 100, 
    ownershipShare: 4, 
    ownerId: 'user-008', 
    ownerName: 'Elif Şahin', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Metin Şahin',
    emergencyPhone: '+90 539 222 33 44',
    vehicles: [],
    pets: [],
    residentHistory: [
      { date: '2024-09-15', action: 'Giriş', resident: 'Elif Şahin (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A401', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 4, 
    number: 'A-401', 
    areaSqm: 155, 
    ownershipShare: 7, 
    ownerId: 'user-014', 
    ownerName: 'Selin Erdoğan', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '4+1',
    emergencyName: 'Ahmet Erdoğan',
    emergencyPhone: '+90 541 333 44 55',
    vehicles: ['34 SSS 55'],
    pets: [],
    residentHistory: [
      { date: '2025-02-15', action: 'Giriş', resident: 'Selin Erdoğan (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A402', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 4, 
    number: 'A-402', 
    areaSqm: 105, 
    ownershipShare: 5, 
    ownerId: undefined, 
    ownerName: 'Tuğçe Başaran', 
    tenantName: undefined, 
    status: 'vacant', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Veli Başaran',
    emergencyPhone: '+90 532 000 11 22',
    vehicles: [],
    pets: [],
    residentHistory: [
      { date: '2025-05-01', action: 'Ayrılma', resident: 'Deniz Can (Eski Kiracı)' }
    ]
  },
  { 
    id: 'unit-A501', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 5, 
    number: 'A-501', 
    areaSqm: 180, 
    ownershipShare: 8, 
    ownerId: undefined, 
    ownerName: 'Oğuz Tanrıverdi', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '4+2 Dupleks',
    emergencyName: 'Mert Tanrıverdi',
    emergencyPhone: '+90 542 777 88 99',
    vehicles: ['34 OGZ 99'],
    pets: ['Maviş (Papağan)'],
    residentHistory: [
      { date: '2024-01-10', action: 'Giriş', resident: 'Oğuz Tanrıverdi (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-A502', 
    tenantId: TENANT_ID, 
    blockName: 'A Blok', 
    floor: 5, 
    number: 'A-502', 
    areaSqm: 115, 
    ownershipShare: 5, 
    ownerId: undefined, 
    ownerName: 'Derya Avcı', 
    tenantName: undefined, 
    status: 'maintenance', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Ali Avcı',
    emergencyPhone: '+90 543 888 77 66',
    vehicles: [],
    pets: [],
    residentHistory: []
  },
  // ---- B Blok ----
  { 
    id: 'unit-B101', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 1, 
    number: 'B-101', 
    areaSqm: 85,  
    ownershipShare: 4, 
    ownerId: 'user-009', 
    ownerName: 'Ali Yıldırım', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'commercial',
    rooms: 'Dükkan',
    emergencyName: 'Hasan Yıldırım',
    emergencyPhone: '+90 532 444 33 22',
    vehicles: ['34 COM 88'],
    pets: [],
    residentHistory: [
      { date: '2024-08-01', action: 'Giriş', resident: 'Ali Yıldırım (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-B102', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 1, 
    number: 'B-102', 
    areaSqm: 90,  
    ownershipShare: 4, 
    ownerId: undefined, 
    ownerName: 'Hülya Karataş', 
    tenantName: 'Hatice Aydın', 
    status: 'occupied', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Murat Aydın',
    emergencyPhone: '+90 555 444 33 22',
    vehicles: [],
    pets: [],
    residentHistory: [
      { date: '2025-02-01', action: 'Kiralama', resident: 'Hatice Aydın (Kiracı)' }
    ]
  },
  { 
    id: 'unit-B201', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 2, 
    number: 'B-201', 
    areaSqm: 125, 
    ownershipShare: 5, 
    ownerId: 'user-011', 
    ownerName: 'İbrahim Koç', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '3+1',
    emergencyName: 'Ayşenur Koç',
    emergencyPhone: '+90 532 111 00 99',
    vehicles: ['34 IBR 10'],
    pets: [],
    residentHistory: [
      { date: '2024-12-01', action: 'Giriş', resident: 'İbrahim Koç (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-B202', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 2, 
    number: 'B-202', 
    areaSqm: 100, 
    ownershipShare: 5, 
    ownerId: 'user-012', 
    ownerName: 'Merve Aksoy', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Kenan Aksoy',
    emergencyPhone: '+90 533 888 77 66',
    vehicles: ['34 MRV 20'],
    pets: ['Tarçın (Kedi)'],
    residentHistory: [
      { date: '2025-01-15', action: 'Giriş', resident: 'Merve Aksoy (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-B301', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 3, 
    number: 'B-301', 
    areaSqm: 135, 
    ownershipShare: 6, 
    ownerId: undefined, 
    ownerName: 'Cenk Yücel', 
    tenantName: 'Emre Polat', 
    status: 'occupied', 
    type: 'residential',
    rooms: '3+1',
    emergencyName: 'Filiz Polat',
    emergencyPhone: '+90 536 777 55 44',
    vehicles: ['34 EMR 30'],
    pets: [],
    residentHistory: [
      { date: '2025-02-10', action: 'Kiralama', resident: 'Emre Polat (Kiracı)' }
    ]
  },
  { 
    id: 'unit-B302', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 3, 
    number: 'B-302', 
    areaSqm: 95,  
    ownershipShare: 4, 
    ownerId: undefined, 
    ownerName: 'Gizem Bayrak', 
    tenantName: undefined, 
    status: 'vacant', 
    type: 'residential',
    rooms: '2+1',
    emergencyName: 'Murat Bayrak',
    emergencyPhone: '+90 537 111 22 33',
    vehicles: [],
    pets: [],
    residentHistory: []
  },
  { 
    id: 'unit-B401', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 4, 
    number: 'B-401', 
    areaSqm: 150, 
    ownershipShare: 7, 
    ownerId: 'user-015', 
    ownerName: 'Burak Çetinkaya', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '3+2',
    emergencyName: 'Aslı Çetinkaya',
    emergencyPhone: '+90 541 444 33 22',
    vehicles: ['34 BRK 40'],
    pets: [],
    residentHistory: [
      { date: '2025-03-01', action: 'Giriş', resident: 'Burak Çetinkaya (Kat Maliki)' }
    ]
  },
  { 
    id: 'unit-B402', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 4, 
    number: 'B-402', 
    areaSqm: 110, 
    ownershipShare: 5, 
    ownerId: undefined, 
    ownerName: 'Esra Güler', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '2.5+1',
    emergencyName: 'Ahmet Güler',
    emergencyPhone: '+90 542 555 44 33',
    vehicles: [],
    pets: [],
    residentHistory: []
  },
  { 
    id: 'unit-B501', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 5, 
    number: 'B-501', 
    areaSqm: 170, 
    ownershipShare: 8, 
    ownerId: undefined, 
    ownerName: 'Cem Karaca', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '4+1 Dupleks',
    emergencyName: 'İlkim Karaca',
    emergencyPhone: '+90 543 666 55 44',
    vehicles: ['34 CEM 50'],
    pets: [],
    residentHistory: []
  },
  { 
    id: 'unit-B502', 
    tenantId: TENANT_ID, 
    blockName: 'B Blok', 
    floor: 5, 
    number: 'B-502', 
    areaSqm: 120, 
    ownershipShare: 5, 
    ownerId: undefined, 
    ownerName: 'Deniz Soylu', 
    tenantName: undefined, 
    status: 'occupied', 
    type: 'residential',
    rooms: '3+1',
    emergencyName: 'Canan Soylu',
    emergencyPhone: '+90 544 777 66 55',
    vehicles: [],
    pets: [],
    residentHistory: []
  },
];

// ============================================================
// Helper: build invoice items
// ============================================================
function aidatItems(aidat: number, extras: InvoiceItem[] = []): InvoiceItem[] {
  return [
    { id: `ii-${Math.random().toString(36).slice(2, 8)}`, description: 'Aylık Aidat', amount: aidat, type: 'charge' },
    ...extras,
  ];
}

// ============================================================
// Invoices (30)
// ============================================================
export const mockInvoices: Invoice[] = [
  // --- 2026-01 ---
  { id: 'inv-001', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', period: '2026-01', totalAmount: 2200, paidAmount: 2200, status: 'paid', dueDate: '2026-01-15', items: aidatItems(2000, [{ id: 'ii-e01', description: 'Isıtma Payı', amount: 200, type: 'charge' }]), createdAt: '2026-01-01T08:00:00Z' },
  { id: 'inv-002', tenantId: TENANT_ID, unitId: 'unit-A102', unitNumber: 'A-102', ownerName: 'Fatma Kaya', period: '2026-01', totalAmount: 1800, paidAmount: 1800, status: 'paid', dueDate: '2026-01-15', items: aidatItems(1650, [{ id: 'ii-e02', description: 'Isıtma Payı', amount: 150, type: 'charge' }]), createdAt: '2026-01-01T08:00:00Z' },
  { id: 'inv-003', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', ownerName: 'Mehmet Demir', period: '2026-01', totalAmount: 2500, paidAmount: 2500, status: 'paid', dueDate: '2026-01-15', items: aidatItems(2200, [{ id: 'ii-e03', description: 'Isıtma Payı', amount: 300, type: 'charge' }]), createdAt: '2026-01-01T08:00:00Z' },
  { id: 'inv-004', tenantId: TENANT_ID, unitId: 'unit-B101', unitNumber: 'B-101', ownerName: 'Ali Yıldırım', period: '2026-01', totalAmount: 1600, paidAmount: 1600, status: 'paid', dueDate: '2026-01-15', items: aidatItems(1600), createdAt: '2026-01-01T08:00:00Z' },
  { id: 'inv-005', tenantId: TENANT_ID, unitId: 'unit-B201', unitNumber: 'B-201', ownerName: 'İbrahim Koç', period: '2026-01', totalAmount: 2300, paidAmount: 2300, status: 'paid', dueDate: '2026-01-15', items: aidatItems(2100, [{ id: 'ii-e05', description: 'Isıtma Payı', amount: 200, type: 'charge' }]), createdAt: '2026-01-01T08:00:00Z' },

  // --- 2026-02 ---
  { id: 'inv-006', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', period: '2026-02', totalAmount: 2200, paidAmount: 2200, status: 'paid', dueDate: '2026-02-15', items: aidatItems(2000, [{ id: 'ii-e06', description: 'Isıtma Payı', amount: 200, type: 'charge' }]), createdAt: '2026-02-01T08:00:00Z' },
  { id: 'inv-007', tenantId: TENANT_ID, unitId: 'unit-A301', unitNumber: 'A-301', ownerName: 'Mustafa Öztürk', period: '2026-02', totalAmount: 2700, paidAmount: 2700, status: 'paid', dueDate: '2026-02-15', items: aidatItems(2400, [{ id: 'ii-e07', description: 'Isıtma Payı', amount: 300, type: 'charge' }]), createdAt: '2026-02-01T08:00:00Z' },
  { id: 'inv-008', tenantId: TENANT_ID, unitId: 'unit-B401', unitNumber: 'B-401', ownerName: 'Burak Çetinkaya', period: '2026-02', totalAmount: 2800, paidAmount: 2800, status: 'paid', dueDate: '2026-02-15', items: aidatItems(2500, [{ id: 'ii-e08', description: 'Isıtma Payı', amount: 300, type: 'charge' }]), createdAt: '2026-02-01T08:00:00Z' },
  { id: 'inv-009', tenantId: TENANT_ID, unitId: 'unit-A202', unitNumber: 'A-202', ownerName: 'Kemal Güneş', period: '2026-02', totalAmount: 2100, paidAmount: 2100, status: 'paid', dueDate: '2026-02-15', items: aidatItems(1900, [{ id: 'ii-e09', description: 'Isıtma Payı', amount: 200, type: 'charge' }]), createdAt: '2026-02-01T08:00:00Z' },
  { id: 'inv-010', tenantId: TENANT_ID, unitId: 'unit-B202', unitNumber: 'B-202', ownerName: 'Merve Aksoy', period: '2026-02', totalAmount: 1900, paidAmount: 1900, status: 'paid', dueDate: '2026-02-15', items: aidatItems(1750, [{ id: 'ii-e10', description: 'Isıtma Payı', amount: 150, type: 'charge' }]), createdAt: '2026-02-01T08:00:00Z' },

  // --- 2026-03 ---
  { id: 'inv-011', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', period: '2026-03', totalAmount: 2050, paidAmount: 2050, status: 'paid', dueDate: '2026-03-15', items: aidatItems(2000, [{ id: 'ii-e11', description: 'Ortak Alan Bakım', amount: 50, type: 'charge' }]), createdAt: '2026-03-01T08:00:00Z' },
  { id: 'inv-012', tenantId: TENANT_ID, unitId: 'unit-A401', unitNumber: 'A-401', ownerName: 'Selin Erdoğan', period: '2026-03', totalAmount: 2900, paidAmount: 2900, status: 'paid', dueDate: '2026-03-15', items: aidatItems(2650, [{ id: 'ii-e12', description: 'Ortak Alan Bakım', amount: 250, type: 'charge' }]), createdAt: '2026-03-01T08:00:00Z' },
  { id: 'inv-013', tenantId: TENANT_ID, unitId: 'unit-B301', unitNumber: 'B-301', ownerName: 'Cenk Yücel', period: '2026-03', totalAmount: 2500, paidAmount: 1500, status: 'partial', dueDate: '2026-03-15', items: aidatItems(2300, [{ id: 'ii-e13', description: 'Ortak Alan Bakım', amount: 200, type: 'charge' }]), createdAt: '2026-03-01T08:00:00Z' },

  // --- 2026-04 ---
  { id: 'inv-014', tenantId: TENANT_ID, unitId: 'unit-A102', unitNumber: 'A-102', ownerName: 'Fatma Kaya', period: '2026-04', totalAmount: 1800, paidAmount: 1800, status: 'paid', dueDate: '2026-04-15', items: aidatItems(1800), createdAt: '2026-04-01T08:00:00Z' },
  { id: 'inv-015', tenantId: TENANT_ID, unitId: 'unit-B102', unitNumber: 'B-102', ownerName: 'Hülya Karataş', period: '2026-04', totalAmount: 1750, paidAmount: 0, status: 'overdue', dueDate: '2026-04-15', items: aidatItems(1750), createdAt: '2026-04-01T08:00:00Z' },
  { id: 'inv-016', tenantId: TENANT_ID, unitId: 'unit-A501', unitNumber: 'A-501', ownerName: 'Oğuz Tanrıverdi', period: '2026-04', totalAmount: 3200, paidAmount: 3200, status: 'paid', dueDate: '2026-04-15', items: aidatItems(3000, [{ id: 'ii-e16', description: 'Havuz Bakım Payı', amount: 200, type: 'charge' }]), createdAt: '2026-04-01T08:00:00Z' },

  // --- 2026-05 ---
  { id: 'inv-017', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', period: '2026-05', totalAmount: 2150, paidAmount: 2150, status: 'paid', dueDate: '2026-05-15', items: aidatItems(2000, [{ id: 'ii-e17', description: 'Asansör Bakım Payı', amount: 150, type: 'charge' }]), createdAt: '2026-05-01T08:00:00Z' },
  { id: 'inv-018', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', ownerName: 'Mehmet Demir', period: '2026-05', totalAmount: 2400, paidAmount: 2400, status: 'paid', dueDate: '2026-05-15', items: aidatItems(2200, [{ id: 'ii-e18', description: 'Asansör Bakım Payı', amount: 200, type: 'charge' }]), createdAt: '2026-05-01T08:00:00Z' },
  { id: 'inv-019', tenantId: TENANT_ID, unitId: 'unit-B501', unitNumber: 'B-501', ownerName: 'Cem Karaca', period: '2026-05', totalAmount: 3100, paidAmount: 0, status: 'overdue', dueDate: '2026-05-15', items: aidatItems(2800, [{ id: 'ii-e19', description: 'Asansör Bakım Payı', amount: 300, type: 'charge' }]), createdAt: '2026-05-01T08:00:00Z' },
  { id: 'inv-020', tenantId: TENANT_ID, unitId: 'unit-B402', unitNumber: 'B-402', ownerName: 'Esra Güler', period: '2026-05', totalAmount: 2050, paidAmount: 1000, status: 'partial', dueDate: '2026-05-15', items: aidatItems(1900, [{ id: 'ii-e20', description: 'Asansör Bakım Payı', amount: 150, type: 'charge' }]), createdAt: '2026-05-01T08:00:00Z' },

  // --- 2026-06 (current month) ---
  { id: 'inv-021', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', period: '2026-06', totalAmount: 2200, paidAmount: 2200, status: 'paid', dueDate: '2026-06-15', items: aidatItems(2000, [{ id: 'ii-e21', description: 'Havuz Bakım Payı', amount: 200, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-022', tenantId: TENANT_ID, unitId: 'unit-A102', unitNumber: 'A-102', ownerName: 'Fatma Kaya', period: '2026-06', totalAmount: 1800, paidAmount: 0, status: 'sent', dueDate: '2026-06-15', items: aidatItems(1650, [{ id: 'ii-e22', description: 'Havuz Bakım Payı', amount: 150, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-023', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', ownerName: 'Mehmet Demir', period: '2026-06', totalAmount: 2500, paidAmount: 0, status: 'sent', dueDate: '2026-06-15', items: aidatItems(2200, [{ id: 'ii-e23', description: 'Havuz Bakım Payı', amount: 300, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-024', tenantId: TENANT_ID, unitId: 'unit-A301', unitNumber: 'A-301', ownerName: 'Mustafa Öztürk', period: '2026-06', totalAmount: 2700, paidAmount: 0, status: 'sent', dueDate: '2026-06-15', items: aidatItems(2400, [{ id: 'ii-e24', description: 'Havuz Bakım Payı', amount: 300, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-025', tenantId: TENANT_ID, unitId: 'unit-B101', unitNumber: 'B-101', ownerName: 'Ali Yıldırım', period: '2026-06', totalAmount: 1600, paidAmount: 1600, status: 'paid', dueDate: '2026-06-15', items: aidatItems(1600), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-026', tenantId: TENANT_ID, unitId: 'unit-B201', unitNumber: 'B-201', ownerName: 'İbrahim Koç', period: '2026-06', totalAmount: 2300, paidAmount: 0, status: 'sent', dueDate: '2026-06-15', items: aidatItems(2100, [{ id: 'ii-e26', description: 'Havuz Bakım Payı', amount: 200, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-027', tenantId: TENANT_ID, unitId: 'unit-A401', unitNumber: 'A-401', ownerName: 'Selin Erdoğan', period: '2026-06', totalAmount: 2900, paidAmount: 0, status: 'draft', dueDate: '2026-06-15', items: aidatItems(2650, [{ id: 'ii-e27', description: 'Havuz Bakım Payı', amount: 250, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-028', tenantId: TENANT_ID, unitId: 'unit-B401', unitNumber: 'B-401', ownerName: 'Burak Çetinkaya', period: '2026-06', totalAmount: 2800, paidAmount: 0, status: 'draft', dueDate: '2026-06-15', items: aidatItems(2500, [{ id: 'ii-e28', description: 'Havuz Bakım Payı', amount: 300, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-029', tenantId: TENANT_ID, unitId: 'unit-B502', unitNumber: 'B-502', ownerName: 'Deniz Soylu', period: '2026-06', totalAmount: 2200, paidAmount: 0, status: 'sent', dueDate: '2026-06-15', items: aidatItems(2000, [{ id: 'ii-e29', description: 'Havuz Bakım Payı', amount: 200, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
  { id: 'inv-030', tenantId: TENANT_ID, unitId: 'unit-A302', unitNumber: 'A-302', ownerName: 'Elif Şahin', period: '2026-06', totalAmount: 1900, paidAmount: 1900, status: 'paid', dueDate: '2026-06-15', items: aidatItems(1750, [{ id: 'ii-e30', description: 'Havuz Bakım Payı', amount: 150, type: 'charge' }]), createdAt: '2026-06-01T08:00:00Z' },
];

// ============================================================
// Payments (20)
// ============================================================
export const mockPayments: Payment[] = [
  { id: 'pay-001', tenantId: TENANT_ID, invoiceId: 'inv-001', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', amount: 2200, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00001', paidAt: '2026-01-10T14:30:00Z' },
  { id: 'pay-002', tenantId: TENANT_ID, invoiceId: 'inv-002', unitNumber: 'A-102', ownerName: 'Fatma Kaya', amount: 1800, method: 'credit_card', status: 'completed', transactionId: 'TXN-2026-00002', paidAt: '2026-01-12T09:15:00Z' },
  { id: 'pay-003', tenantId: TENANT_ID, invoiceId: 'inv-003', unitNumber: 'A-201', ownerName: 'Mehmet Demir', amount: 2500, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00003', paidAt: '2026-01-14T16:00:00Z' },
  { id: 'pay-004', tenantId: TENANT_ID, invoiceId: 'inv-004', unitNumber: 'B-101', ownerName: 'Ali Yıldırım', amount: 1600, method: 'cash', status: 'completed', paidAt: '2026-01-13T11:00:00Z' },
  { id: 'pay-005', tenantId: TENANT_ID, invoiceId: 'inv-005', unitNumber: 'B-201', ownerName: 'İbrahim Koç', amount: 2300, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00005', paidAt: '2026-01-15T08:45:00Z' },
  { id: 'pay-006', tenantId: TENANT_ID, invoiceId: 'inv-006', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', amount: 2200, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00006', paidAt: '2026-02-08T10:00:00Z' },
  { id: 'pay-007', tenantId: TENANT_ID, invoiceId: 'inv-007', unitNumber: 'A-301', ownerName: 'Mustafa Öztürk', amount: 2700, method: 'credit_card', status: 'completed', transactionId: 'TXN-2026-00007', paidAt: '2026-02-10T13:30:00Z' },
  { id: 'pay-008', tenantId: TENANT_ID, invoiceId: 'inv-008', unitNumber: 'B-401', ownerName: 'Burak Çetinkaya', amount: 2800, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00008', paidAt: '2026-02-12T15:00:00Z' },
  { id: 'pay-009', tenantId: TENANT_ID, invoiceId: 'inv-009', unitNumber: 'A-202', ownerName: 'Kemal Güneş', amount: 2100, method: 'cash', status: 'completed', paidAt: '2026-02-14T09:00:00Z' },
  { id: 'pay-010', tenantId: TENANT_ID, invoiceId: 'inv-010', unitNumber: 'B-202', ownerName: 'Merve Aksoy', amount: 1900, method: 'credit_card', status: 'completed', transactionId: 'TXN-2026-00010', paidAt: '2026-02-15T12:00:00Z' },
  { id: 'pay-011', tenantId: TENANT_ID, invoiceId: 'inv-011', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', amount: 2050, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00011', paidAt: '2026-03-09T10:30:00Z' },
  { id: 'pay-012', tenantId: TENANT_ID, invoiceId: 'inv-012', unitNumber: 'A-401', ownerName: 'Selin Erdoğan', amount: 2900, method: 'credit_card', status: 'completed', transactionId: 'TXN-2026-00012', paidAt: '2026-03-11T14:00:00Z' },
  { id: 'pay-013', tenantId: TENANT_ID, invoiceId: 'inv-013', unitNumber: 'B-301', ownerName: 'Cenk Yücel', amount: 1500, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00013', paidAt: '2026-03-14T16:30:00Z' },
  { id: 'pay-014', tenantId: TENANT_ID, invoiceId: 'inv-014', unitNumber: 'A-102', ownerName: 'Fatma Kaya', amount: 1800, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00014', paidAt: '2026-04-10T09:00:00Z' },
  { id: 'pay-015', tenantId: TENANT_ID, invoiceId: 'inv-016', unitNumber: 'A-501', ownerName: 'Oğuz Tanrıverdi', amount: 3200, method: 'credit_card', status: 'completed', transactionId: 'TXN-2026-00015', paidAt: '2026-04-12T11:00:00Z' },
  { id: 'pay-016', tenantId: TENANT_ID, invoiceId: 'inv-017', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', amount: 2150, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00016', paidAt: '2026-05-08T10:00:00Z' },
  { id: 'pay-017', tenantId: TENANT_ID, invoiceId: 'inv-018', unitNumber: 'A-201', ownerName: 'Mehmet Demir', amount: 2400, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00017', paidAt: '2026-05-10T14:00:00Z' },
  { id: 'pay-018', tenantId: TENANT_ID, invoiceId: 'inv-020', unitNumber: 'B-402', ownerName: 'Esra Güler', amount: 1000, method: 'cash', status: 'completed', paidAt: '2026-05-14T09:30:00Z' },
  { id: 'pay-019', tenantId: TENANT_ID, invoiceId: 'inv-021', unitNumber: 'A-101', ownerName: 'Ahmet Yılmaz', amount: 2200, method: 'bank_transfer', status: 'completed', transactionId: 'TXN-2026-00019', paidAt: '2026-06-05T10:00:00Z' },
  { id: 'pay-020', tenantId: TENANT_ID, invoiceId: 'inv-025', unitNumber: 'B-101', ownerName: 'Ali Yıldırım', amount: 1600, method: 'credit_card', status: 'completed', transactionId: 'TXN-2026-00020', paidAt: '2026-06-07T12:00:00Z' },
];

// ============================================================
// Tasks (15)
// ============================================================
export const mockTasks: Task[] = [
  {
    id: 'task-001', tenantId: TENANT_ID,
    title: 'Asansör periyodik bakımı',
    description: 'A Blok asansörünün yıllık periyodik bakımı yapılacak. Bakım firması ile randevu alındı.',
    status: 'in_progress', priority: 'high', category: 'maintenance',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-003', reporterName: 'Ahmet Yılmaz',
    createdAt: '2026-06-01T09:00:00Z', updatedAt: '2026-06-10T14:00:00Z',
    dueDate: '2026-06-20',
  },
  {
    id: 'task-002', tenantId: TENANT_ID,
    title: 'Bahçe sulama sistemi arızası',
    description: 'Otomatik sulama sisteminin 3 numaralı sprinkler\'ı çalışmıyor. Su sızıntısı da gözlemlendi.',
    status: 'open', priority: 'medium', category: 'maintenance',
    assigneeName: undefined,
    reporterId: 'user-007', reporterName: 'Mustafa Öztürk',
    createdAt: '2026-06-05T11:00:00Z', updatedAt: '2026-06-05T11:00:00Z',
    dueDate: '2026-06-18',
  },
  {
    id: 'task-003', tenantId: TENANT_ID,
    title: 'Otopark temizliği',
    description: 'Bodrum kat otoparkının genel temizliği ve çizgi boyaması yapılacak.',
    status: 'done', priority: 'low', category: 'cleaning',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-001', reporterName: 'Hasan Korkmaz',
    createdAt: '2026-05-20T08:00:00Z', updatedAt: '2026-06-02T16:00:00Z',
    dueDate: '2026-06-01',
  },
  {
    id: 'task-004', tenantId: TENANT_ID,
    title: 'Güvenlik kamerası arızası – B Blok giriş',
    description: 'B Blok ana giriş kamerasında görüntü donması problemi yaşanıyor. Kayıt da durmuş olabilir.',
    status: 'in_progress', priority: 'urgent', category: 'security',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-009', reporterName: 'Ali Yıldırım',
    createdAt: '2026-06-12T07:30:00Z', updatedAt: '2026-06-13T10:00:00Z',
    dueDate: '2026-06-14',
  },
  {
    id: 'task-005', tenantId: TENANT_ID,
    title: 'Havuz sezon açılışı hazırlıkları',
    description: 'Havuz suyu analizi, kimyasal dengeleme, fayans temizliği ve şezlong bakımı.',
    status: 'done', priority: 'high', category: 'maintenance',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-001', reporterName: 'Hasan Korkmaz',
    createdAt: '2026-05-01T09:00:00Z', updatedAt: '2026-05-28T17:00:00Z',
    dueDate: '2026-05-30',
  },
  {
    id: 'task-006', tenantId: TENANT_ID,
    title: 'Merdiven aydınlatma değişimi – A Blok',
    description: 'A Blok 3. ve 4. kat merdiven aydınlatmaları yanmıyor. LED paneller ile değiştirilecek.',
    status: 'open', priority: 'medium', category: 'maintenance',
    reporterId: 'user-008', reporterName: 'Elif Şahin',
    unitId: 'unit-A302', unitNumber: 'A-302',
    createdAt: '2026-06-10T15:00:00Z', updatedAt: '2026-06-10T15:00:00Z',
    dueDate: '2026-06-25',
  },
  {
    id: 'task-007', tenantId: TENANT_ID,
    title: 'Çöp konteyneri değişimi',
    description: 'Site girişindeki çöp konteynerleri eski ve hasarlı. Belediye ile iletişime geçilecek.',
    status: 'open', priority: 'low', category: 'other',
    reporterId: 'user-004', reporterName: 'Fatma Kaya',
    createdAt: '2026-06-08T12:00:00Z', updatedAt: '2026-06-08T12:00:00Z',
  },
  {
    id: 'task-008', tenantId: TENANT_ID,
    title: 'Su deposu temizliği',
    description: 'Yıllık su deposu temizliği ve dezenfeksiyonu. Sağlık müdürlüğü raporu alınacak.',
    status: 'in_progress', priority: 'high', category: 'cleaning',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-001', reporterName: 'Hasan Korkmaz',
    createdAt: '2026-06-11T08:00:00Z', updatedAt: '2026-06-14T09:00:00Z',
    dueDate: '2026-06-17',
  },
  {
    id: 'task-009', tenantId: TENANT_ID,
    title: 'Daire su kaçağı – A-202',
    description: 'A-202 dairesinin banyosundan alt kata su sızıntısı bildirimi. Acil müdahale gerekli.',
    status: 'done', priority: 'urgent', category: 'maintenance',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-006', reporterName: 'Ayşe Çelik',
    unitId: 'unit-A202', unitNumber: 'A-202',
    createdAt: '2026-06-03T18:00:00Z', updatedAt: '2026-06-04T12:00:00Z',
    dueDate: '2026-06-04',
  },
  {
    id: 'task-010', tenantId: TENANT_ID,
    title: 'Kapıcı dairesi boyama',
    description: 'Kapıcı dairesinin iç cephe boyası yenilenecek.',
    status: 'cancelled', priority: 'low', category: 'maintenance',
    reporterId: 'user-001', reporterName: 'Hasan Korkmaz',
    createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-05-01T11:00:00Z',
  },
  {
    id: 'task-011', tenantId: TENANT_ID,
    title: 'Gece güvenlik devriye düzenlemesi',
    description: 'Gece 23:00-06:00 arası devriye güzergahı ve sıklığı güncellenecek.',
    status: 'done', priority: 'medium', category: 'security',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-015', reporterName: 'Burak Çetinkaya',
    createdAt: '2026-05-10T09:00:00Z', updatedAt: '2026-05-20T14:00:00Z',
    dueDate: '2026-05-18',
  },
  {
    id: 'task-012', tenantId: TENANT_ID,
    title: 'Ortak alan derin temizlik',
    description: 'Lobi, merdiven boşlukları ve koridor halılarının şampuanlı yıkaması.',
    status: 'open', priority: 'medium', category: 'cleaning',
    reporterId: 'user-012', reporterName: 'Merve Aksoy',
    createdAt: '2026-06-13T10:00:00Z', updatedAt: '2026-06-13T10:00:00Z',
    dueDate: '2026-06-22',
  },
  {
    id: 'task-013', tenantId: TENANT_ID,
    title: 'Jeneratör bakımı',
    description: 'Dizel jeneratörün periyodik bakımı, yağ ve filtre değişimi.',
    status: 'open', priority: 'high', category: 'maintenance',
    reporterId: 'user-001', reporterName: 'Hasan Korkmaz',
    createdAt: '2026-06-14T08:00:00Z', updatedAt: '2026-06-14T08:00:00Z',
    dueDate: '2026-06-28',
  },
  {
    id: 'task-014', tenantId: TENANT_ID,
    title: 'Çocuk parkı zemin yenileme',
    description: 'Çocuk parkı kauçuk zemin kaplama yıpranmış, güvenlik açısından yenilenmeli.',
    status: 'open', priority: 'medium', category: 'maintenance',
    reporterId: 'user-014', reporterName: 'Selin Erdoğan',
    createdAt: '2026-06-09T11:00:00Z', updatedAt: '2026-06-09T11:00:00Z',
    dueDate: '2026-07-15',
  },
  {
    id: 'task-015', tenantId: TENANT_ID,
    title: 'Yangın söndürme tüpü kontrolü',
    description: 'Tüm blok ve ortak alanlardaki yangın söndürme tüplerinin dolum tarihi ve basınç kontrolü.',
    status: 'in_progress', priority: 'high', category: 'security',
    assigneeId: 'user-001', assigneeName: 'Hasan Korkmaz',
    reporterId: 'user-001', reporterName: 'Hasan Korkmaz',
    createdAt: '2026-06-07T09:00:00Z', updatedAt: '2026-06-12T16:00:00Z',
    dueDate: '2026-06-20',
  },
];

// ============================================================
// Documents (5)
// ============================================================
export const mockDocuments: Document[] = [
  {
    id: 'doc-001', tenantId: TENANT_ID,
    title: 'Havuz Kullanım Kuralları – 2026 Sezonu',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Havuz Kullanım Kuralları' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Havuz 1 Haziran – 15 Eylül tarihleri arasında 08:00-22:00 saatleri arasında kullanıma açıktır.' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '12 yaş altı çocuklar ebeveyn eşliğinde girebilir.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Havuz alanında cam eşya kullanımı yasaktır.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Duş almadan havuza girmek yasaktır.' }] }] },
        ] },
      ],
    },
    type: 'rule',
    authorId: 'user-001', authorName: 'Hasan Korkmaz',
    isPinned: true,
    createdAt: '2026-05-25T09:00:00Z', updatedAt: '2026-05-25T09:00:00Z',
  },
  {
    id: 'doc-002', tenantId: TENANT_ID,
    title: 'Haziran 2026 Genel Kurul Toplantı Tutanağı',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Genel Kurul Toplantı Tutanağı' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Tarih: 08 Haziran 2026, Saat: 14:00, Yer: Site Toplantı Salonu' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Katılım: 20 daireden 16 katılım sağlanmıştır. Yeter sayıya ulaşılmıştır.' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Yönetim kurulu faaliyet raporu okundu ve oybirliği ile kabul edildi.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '2026-2027 dönemi tahmini bütçe onaylandı.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dış cephe boyama projesi için teklif alınması kararı verildi.' }] }] },
        ] },
      ],
    },
    type: 'minutes',
    authorId: 'user-002', authorName: 'Zeynep Arslan',
    isPinned: false,
    createdAt: '2026-06-08T18:00:00Z', updatedAt: '2026-06-09T10:00:00Z',
  },
  {
    id: 'doc-003', tenantId: TENANT_ID,
    title: 'Su Kesintisi Duyurusu – 18 Haziran 2026',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '📢 Su Kesintisi Bildirimi' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Sayın Site Sakinlerimiz,' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'İSKİ tarafından yapılacak alt yapı çalışması nedeniyle 18 Haziran 2026 Çarşamba günü saat 09:00-17:00 arasında su kesintisi uygulanacaktır.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Lütfen gerekli tedbirlerinizi alınız. Bilgilerinize sunarız.' }] },
      ],
    },
    type: 'announcement',
    authorId: 'user-001', authorName: 'Hasan Korkmaz',
    isPinned: true,
    createdAt: '2026-06-14T12:00:00Z', updatedAt: '2026-06-14T12:00:00Z',
  },
  {
    id: 'doc-004', tenantId: TENANT_ID,
    title: 'Site İç Yönetmeliği',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Yıldız Konakları Sitesi İç Yönetmeliği' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Bu yönetmelik, Yıldız Konakları Sitesi sakinlerinin uyması gereken kuralları belirler.' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gürültü saatleri: 22:00-08:00 arasında sessizlik esastır.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Evcil hayvanlar tasma ile ortak alanlarda gezdirilebilir.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Balkonlardan halı silkeleme ve çamaşır asma yasaktır.' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tadilat işleri hafta içi 09:00-18:00, Cumartesi 10:00-14:00 saatlerinde yapılabilir.' }] }] },
        ] },
      ],
    },
    type: 'rule',
    authorId: 'user-001', authorName: 'Hasan Korkmaz',
    isPinned: true,
    createdAt: '2025-03-01T10:00:00Z', updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'doc-005', tenantId: TENANT_ID,
    title: 'Asansör Bakım Bildirimi',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Asansör Bakım Çalışması' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Sayın Sakinlerimiz, A Blok asansörü 20 Haziran 2026 Cuma günü saat 10:00-16:00 arasında periyodik bakım çalışması nedeniyle hizmet dışı olacaktır.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Lütfen bu süre zarfında merdivenleri kullanınız. Anlayışınız için teşekkür ederiz.' }] },
      ],
    },
    type: 'notice',
    authorId: 'user-001', authorName: 'Hasan Korkmaz',
    isPinned: false,
    createdAt: '2026-06-15T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z',
  },
];

// ============================================================
// Notifications (20)
// ============================================================
export const mockNotifications: Notification[] = [
  { id: 'notif-001', tenantId: TENANT_ID, userId: 'user-003', title: 'Fatura Oluşturuldu', message: 'Haziran 2026 aidatınız oluşturulmuştur. Tutar: ₺2.200', type: 'invoice', isRead: true, link: '/invoices/inv-021', createdAt: '2026-06-01T08:00:00Z' },
  { id: 'notif-002', tenantId: TENANT_ID, userId: 'user-004', title: 'Fatura Oluşturuldu', message: 'Haziran 2026 aidatınız oluşturulmuştur. Tutar: ₺1.800', type: 'invoice', isRead: false, link: '/invoices/inv-022', createdAt: '2026-06-01T08:01:00Z' },
  { id: 'notif-003', tenantId: TENANT_ID, userId: 'user-005', title: 'Fatura Oluşturuldu', message: 'Haziran 2026 aidatınız oluşturulmuştur. Tutar: ₺2.500', type: 'invoice', isRead: false, link: '/invoices/inv-023', createdAt: '2026-06-01T08:02:00Z' },
  { id: 'notif-004', tenantId: TENANT_ID, userId: 'user-003', title: 'Ödeme Onaylandı', message: 'Haziran 2026 aidatınızın ödemesi başarıyla alınmıştır.', type: 'payment', isRead: true, link: '/payments/pay-019', createdAt: '2026-06-05T10:01:00Z' },
  { id: 'notif-005', tenantId: TENANT_ID, userId: 'user-009', title: 'Ödeme Onaylandı', message: 'Haziran 2026 aidatınızın ödemesi başarıyla alınmıştır.', type: 'payment', isRead: true, link: '/payments/pay-020', createdAt: '2026-06-07T12:01:00Z' },
  { id: 'notif-006', tenantId: TENANT_ID, userId: 'user-001', title: 'Yeni Arıza Bildirimi', message: 'Bahçe sulama sistemi arızası bildirildi.', type: 'task', isRead: true, link: '/tasks/task-002', createdAt: '2026-06-05T11:01:00Z' },
  { id: 'notif-007', tenantId: TENANT_ID, userId: 'user-001', title: 'Acil Arıza!', message: 'B Blok giriş güvenlik kamerası arızası bildirildi.', type: 'task', isRead: true, link: '/tasks/task-004', createdAt: '2026-06-12T07:31:00Z' },
  { id: 'notif-008', tenantId: TENANT_ID, userId: 'user-003', title: 'Duyuru: Su Kesintisi', message: '18 Haziran 2026 tarihinde 09:00-17:00 arası su kesintisi yapılacaktır.', type: 'announcement', isRead: true, link: '/documents/doc-003', createdAt: '2026-06-14T12:01:00Z' },
  { id: 'notif-009', tenantId: TENANT_ID, userId: 'user-004', title: 'Duyuru: Su Kesintisi', message: '18 Haziran 2026 tarihinde 09:00-17:00 arası su kesintisi yapılacaktır.', type: 'announcement', isRead: false, link: '/documents/doc-003', createdAt: '2026-06-14T12:01:00Z' },
  { id: 'notif-010', tenantId: TENANT_ID, userId: 'user-005', title: 'Duyuru: Su Kesintisi', message: '18 Haziran 2026 tarihinde 09:00-17:00 arası su kesintisi yapılacaktır.', type: 'announcement', isRead: false, link: '/documents/doc-003', createdAt: '2026-06-14T12:01:00Z' },
  { id: 'notif-011', tenantId: TENANT_ID, userId: 'user-007', title: 'Duyuru: Asansör Bakımı', message: 'A Blok asansörü 20 Haziran\'da bakım nedeniyle kapalı olacaktır.', type: 'announcement', isRead: false, link: '/documents/doc-005', createdAt: '2026-06-15T08:01:00Z' },
  { id: 'notif-012', tenantId: TENANT_ID, userId: 'user-008', title: 'Duyuru: Asansör Bakımı', message: 'A Blok asansörü 20 Haziran\'da bakım nedeniyle kapalı olacaktır.', type: 'announcement', isRead: false, link: '/documents/doc-005', createdAt: '2026-06-15T08:01:00Z' },
  { id: 'notif-013', tenantId: TENANT_ID, userId: 'user-001', title: 'Gecikmiş Ödeme', message: 'B-102 Hülya Karataş – Nisan 2026 aidatı hâlâ ödenmemiştir.', type: 'invoice', isRead: true, link: '/invoices/inv-015', createdAt: '2026-05-01T08:00:00Z' },
  { id: 'notif-014', tenantId: TENANT_ID, userId: 'user-001', title: 'Gecikmiş Ödeme', message: 'B-501 Cem Karaca – Mayıs 2026 aidatı hâlâ ödenmemiştir.', type: 'invoice', isRead: false, link: '/invoices/inv-019', createdAt: '2026-06-01T08:00:00Z' },
  { id: 'notif-015', tenantId: TENANT_ID, userId: 'user-001', title: 'Sistem Güncellemesi', message: 'Platform yeni sürüme güncellendi. Yeni özellikler için değişiklik notlarını inceleyin.', type: 'system', isRead: false, createdAt: '2026-06-10T06:00:00Z' },
  { id: 'notif-016', tenantId: TENANT_ID, userId: 'user-006', title: 'Görev Tamamlandı', message: 'Daire su kaçağı – A-202 görevi tamamlandı.', type: 'task', isRead: true, link: '/tasks/task-009', createdAt: '2026-06-04T12:01:00Z' },
  { id: 'notif-017', tenantId: TENANT_ID, userId: 'user-014', title: 'Fatura Oluşturuldu', message: 'Haziran 2026 aidatınız oluşturulmuştur. Tutar: ₺2.900', type: 'invoice', isRead: false, link: '/invoices/inv-027', createdAt: '2026-06-01T08:03:00Z' },
  { id: 'notif-018', tenantId: TENANT_ID, userId: 'user-015', title: 'Fatura Oluşturuldu', message: 'Haziran 2026 aidatınız oluşturulmuştur. Tutar: ₺2.800', type: 'invoice', isRead: false, link: '/invoices/inv-028', createdAt: '2026-06-01T08:04:00Z' },
  { id: 'notif-019', tenantId: TENANT_ID, userId: 'user-012', title: 'Görev Atandı', message: 'Ortak alan derin temizlik görevi oluşturuldu.', type: 'task', isRead: false, link: '/tasks/task-012', createdAt: '2026-06-13T10:01:00Z' },
  { id: 'notif-020', tenantId: TENANT_ID, userId: 'user-001', title: 'Yeni Arıza Bildirimi', message: 'Merdiven aydınlatma değişimi – A Blok bildirildi.', type: 'task', isRead: false, link: '/tasks/task-006', createdAt: '2026-06-10T15:01:00Z' },
];

// ============================================================
// Meter Readings (24 – sample for a few units, multiple types)
// ============================================================
export const mockMeterReadings: MeterReading[] = [
  // A-101 – May & June
  { id: 'mr-001', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', type: 'water', previousReading: 1245, currentReading: 1263, consumption: 18, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-002', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', type: 'water', previousReading: 1263, currentReading: 1284, consumption: 21, readingDate: '2026-06-01', period: '2026-06' },
  { id: 'mr-003', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', type: 'electricity', previousReading: 8540, currentReading: 8790, consumption: 250, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-004', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', type: 'electricity', previousReading: 8790, currentReading: 9060, consumption: 270, readingDate: '2026-06-01', period: '2026-06' },
  { id: 'mr-005', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', type: 'gas', previousReading: 3420, currentReading: 3455, consumption: 35, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-006', tenantId: TENANT_ID, unitId: 'unit-A101', unitNumber: 'A-101', type: 'gas', previousReading: 3455, currentReading: 3478, consumption: 23, readingDate: '2026-06-01', period: '2026-06' },

  // A-201
  { id: 'mr-007', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', type: 'water', previousReading: 980, currentReading: 1002, consumption: 22, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-008', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', type: 'water', previousReading: 1002, currentReading: 1028, consumption: 26, readingDate: '2026-06-01', period: '2026-06' },
  { id: 'mr-009', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', type: 'electricity', previousReading: 6320, currentReading: 6610, consumption: 290, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-010', tenantId: TENANT_ID, unitId: 'unit-A201', unitNumber: 'A-201', type: 'electricity', previousReading: 6610, currentReading: 6920, consumption: 310, readingDate: '2026-06-01', period: '2026-06' },

  // B-101
  { id: 'mr-011', tenantId: TENANT_ID, unitId: 'unit-B101', unitNumber: 'B-101', type: 'water', previousReading: 560, currentReading: 572, consumption: 12, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-012', tenantId: TENANT_ID, unitId: 'unit-B101', unitNumber: 'B-101', type: 'water', previousReading: 572, currentReading: 586, consumption: 14, readingDate: '2026-06-01', period: '2026-06' },
  { id: 'mr-013', tenantId: TENANT_ID, unitId: 'unit-B101', unitNumber: 'B-101', type: 'electricity', previousReading: 12400, currentReading: 12850, consumption: 450, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-014', tenantId: TENANT_ID, unitId: 'unit-B101', unitNumber: 'B-101', type: 'electricity', previousReading: 12850, currentReading: 13340, consumption: 490, readingDate: '2026-06-01', period: '2026-06' },

  // B-401
  { id: 'mr-015', tenantId: TENANT_ID, unitId: 'unit-B401', unitNumber: 'B-401', type: 'water', previousReading: 780, currentReading: 798, consumption: 18, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-016', tenantId: TENANT_ID, unitId: 'unit-B401', unitNumber: 'B-401', type: 'water', previousReading: 798, currentReading: 820, consumption: 22, readingDate: '2026-06-01', period: '2026-06' },
  { id: 'mr-017', tenantId: TENANT_ID, unitId: 'unit-B401', unitNumber: 'B-401', type: 'gas', previousReading: 2100, currentReading: 2130, consumption: 30, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-018', tenantId: TENANT_ID, unitId: 'unit-B401', unitNumber: 'B-401', type: 'gas', previousReading: 2130, currentReading: 2150, consumption: 20, readingDate: '2026-06-01', period: '2026-06' },

  // A-301 – hot water
  { id: 'mr-019', tenantId: TENANT_ID, unitId: 'unit-A301', unitNumber: 'A-301', type: 'hot_water', previousReading: 320, currentReading: 334, consumption: 14, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-020', tenantId: TENANT_ID, unitId: 'unit-A301', unitNumber: 'A-301', type: 'hot_water', previousReading: 334, currentReading: 350, consumption: 16, readingDate: '2026-06-01', period: '2026-06' },

  // A-401 – heating
  { id: 'mr-021', tenantId: TENANT_ID, unitId: 'unit-A401', unitNumber: 'A-401', type: 'heating', previousReading: 4500, currentReading: 4520, consumption: 20, readingDate: '2026-05-01', period: '2026-05' },
  { id: 'mr-022', tenantId: TENANT_ID, unitId: 'unit-A401', unitNumber: 'A-401', type: 'heating', previousReading: 4520, currentReading: 4530, consumption: 10, readingDate: '2026-06-01', period: '2026-06' },

  // B-202
  { id: 'mr-023', tenantId: TENANT_ID, unitId: 'unit-B202', unitNumber: 'B-202', type: 'water', previousReading: 440, currentReading: 455, consumption: 15, readingDate: '2026-06-01', period: '2026-06' },
  { id: 'mr-024', tenantId: TENANT_ID, unitId: 'unit-B202', unitNumber: 'B-202', type: 'electricity', previousReading: 5120, currentReading: 5350, consumption: 230, readingDate: '2026-06-01', period: '2026-06' },
];

// ============================================================
// Financial Accounts
// ============================================================
export const mockFinancialAccounts: FinancialAccount[] = [
  { id: 'fa-001', tenantId: TENANT_ID, name: 'Banka Hesabı – İş Bankası', type: 'asset', balance: 185_400, code: '100' },
  { id: 'fa-002', tenantId: TENANT_ID, name: 'Kasa', type: 'asset', balance: 12_800, code: '101' },
  { id: 'fa-003', tenantId: TENANT_ID, name: 'Aidat Alacakları', type: 'asset', balance: 14_600, code: '120' },
  { id: 'fa-004', tenantId: TENANT_ID, name: 'Tedarikçi Borçları', type: 'liability', balance: 8_500, code: '320' },
  { id: 'fa-005', tenantId: TENANT_ID, name: 'Site Fonu', type: 'equity', balance: 120_000, code: '500' },
  { id: 'fa-006', tenantId: TENANT_ID, name: 'Aidat Gelirleri', type: 'revenue', balance: 478_350, code: '600' },
  { id: 'fa-007', tenantId: TENANT_ID, name: 'Bakım & Onarım Giderleri', type: 'expense', balance: 85_200, code: '770' },
  { id: 'fa-008', tenantId: TENANT_ID, name: 'Personel Giderleri', type: 'expense', balance: 108_000, code: '750' },
  { id: 'fa-009', tenantId: TENANT_ID, name: 'Enerji Giderleri', type: 'expense', balance: 42_300, code: '760' },
  { id: 'fa-010', tenantId: TENANT_ID, name: 'Sigorta Giderleri', type: 'expense', balance: 15_000, code: '780' },
];

// ============================================================
// Monthly Finance (12 months – 2026)
// ============================================================
export const mockMonthlyFinance: MonthlyFinance[] = [
  { month: '2026-01', revenue: 42_500, expense: 28_600, collection: 91 },
  { month: '2026-02', revenue: 43_200, expense: 31_200, collection: 93 },
  { month: '2026-03', revenue: 41_800, expense: 26_500, collection: 88 },
  { month: '2026-04', revenue: 44_100, expense: 29_800, collection: 85 },
  { month: '2026-05', revenue: 43_600, expense: 33_400, collection: 82 },
  { month: '2026-06', revenue: 38_200, expense: 35_100, collection: 74 },
  { month: '2026-07', revenue: 0,      expense: 0,      collection: 0 },
  { month: '2026-08', revenue: 0,      expense: 0,      collection: 0 },
  { month: '2026-09', revenue: 0,      expense: 0,      collection: 0 },
  { month: '2026-10', revenue: 0,      expense: 0,      collection: 0 },
  { month: '2026-11', revenue: 0,      expense: 0,      collection: 0 },
  { month: '2026-12', revenue: 0,      expense: 0,      collection: 0 },
];

// ============================================================
// Dashboard Stats
// ============================================================
export const mockDashboardStats: DashboardStats = {
  totalRevenue: 253_400,
  totalExpenses: 184_600,
  collectionRate: 87,
  totalUnits: 20,
  occupiedUnits: 17,
  overdueInvoices: 3,
  openTasks: 6,
  unreadNotifications: 9,
};

// ============================================================
// Default Widgets
// ============================================================
export const mockWidgets: Widget[] = [
  {
    id: 'widget-001',
    type: 'financial_summary',
    title: 'Finansal Özet',
    config: { showChart: true, period: 'monthly' },
    position: { x: 0, y: 0 },
    size: { width: 2, height: 1 },
  },
  {
    id: 'widget-002',
    type: 'recent_invoices',
    title: 'Son Faturalar',
    config: { limit: 5, showStatus: true },
    position: { x: 2, y: 0 },
    size: { width: 1, height: 1 },
  },
  {
    id: 'widget-003',
    type: 'task_list',
    title: 'Açık Görevler',
    config: { statusFilter: ['open', 'in_progress'], limit: 5 },
    position: { x: 0, y: 1 },
    size: { width: 1, height: 1 },
  },
  {
    id: 'widget-004',
    type: 'announcements',
    title: 'Duyurular',
    config: { pinnedOnly: false, limit: 3 },
    position: { x: 1, y: 1 },
    size: { width: 1, height: 1 },
  },
  {
    id: 'widget-005',
    type: 'meter_chart',
    title: 'Sayaç Tüketim Grafiği',
    config: { meterTypes: ['water', 'electricity', 'gas'], chartType: 'bar' },
    position: { x: 2, y: 1 },
    size: { width: 1, height: 1 },
  },
  {
    id: 'widget-006',
    type: 'occupancy',
    title: 'Doluluk Oranı',
    config: { showByBlock: true },
    position: { x: 0, y: 2 },
    size: { width: 1, height: 1 },
  },
];

// ============================================================
// Current (logged-in) user shortcut
// ============================================================
export const mockCurrentUser: User = mockUsers[0]; // Hasan Korkmaz – site_manager
