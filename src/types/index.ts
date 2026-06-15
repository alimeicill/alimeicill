// ============================================================
// Apartment Management Platform – Type Definitions
// ============================================================

// -------------------- User & Auth --------------------

export type UserRole =
  | 'super_admin'
  | 'site_manager'
  | 'block_rep'
  | 'owner'
  | 'tenant'
  | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  unitId?: string;
  tenantId: string;
  createdAt: string;
}

// -------------------- Tenant (Site / Apartman) --------------------

export interface Tenant {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  totalUnits: number;
  totalBlocks: number;
  settings: Record<string, any>;
  createdAt: string;
}

// -------------------- Unit (Daire) --------------------

export type UnitStatus = 'occupied' | 'vacant' | 'maintenance';
export type UnitType = 'residential' | 'commercial' | 'parking';

export interface Unit {
  id: string;
  tenantId: string;
  blockName: string;
  floor: number;
  number: string;
  areaSqm: number;
  ownershipShare: number;
  ownerId?: string;
  ownerName?: string;
  tenantName?: string;
  status: UnitStatus;
  type: UnitType;
}

// -------------------- Invoice (Fatura) --------------------

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

export type InvoiceItemType = 'charge' | 'credit' | 'adjustment' | 'late_fee';

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  type: InvoiceItemType;
}

export interface Invoice {
  id: string;
  tenantId: string;
  unitId: string;
  unitNumber: string;
  ownerName: string;
  period: string; // e.g. '2026-06'
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  items: InvoiceItem[];
  createdAt: string;
}

// -------------------- Payment --------------------

export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  unitNumber: string;
  ownerName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt: string;
}

// -------------------- Task --------------------

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'maintenance' | 'cleaning' | 'security' | 'other';

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assigneeId?: string;
  assigneeName?: string;
  reporterId: string;
  reporterName: string;
  unitId?: string;
  unitNumber?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

// -------------------- Document --------------------

export type DocumentType = 'announcement' | 'rule' | 'minutes' | 'notice';

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  content: any; // Tiptap JSON
  type: DocumentType;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------------------- Notification --------------------

export type NotificationType =
  | 'invoice'
  | 'payment'
  | 'task'
  | 'announcement'
  | 'system';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// -------------------- Meter Reading --------------------

export type MeterType = 'water' | 'hot_water' | 'electricity' | 'gas' | 'heating';

export interface MeterReading {
  id: string;
  tenantId: string;
  unitId: string;
  unitNumber: string;
  type: MeterType;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  period: string;
}

// -------------------- Dashboard --------------------

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  collectionRate: number;
  totalUnits: number;
  occupiedUnits: number;
  overdueInvoices: number;
  openTasks: number;
  unreadNotifications: number;
}

export type WidgetType =
  | 'financial_summary'
  | 'recent_invoices'
  | 'task_list'
  | 'announcements'
  | 'meter_chart'
  | 'occupancy';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// -------------------- Financial --------------------

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface FinancialAccount {
  id: string;
  tenantId: string;
  name: string;
  type: AccountType;
  balance: number;
  code: string;
}

export interface MonthlyFinance {
  month: string;
  revenue: number;
  expense: number;
  collection: number;
}
