export type Dec = string;

export interface Site {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  _count?: { blocks: number; units: number };
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  tckn: string | null;
  notes: string | null;
  kvkkConsentAt: string | null;
}

export interface UnitType {
  id: string;
  name: string;
  code: string | null;
  coefficient: Dec;
  _count?: { units: number };
}

export interface Occupant {
  id: string;
  role: 'OWNER' | 'TENANT';
  isDebtor: boolean;
  person: Person;
}

export interface UnitRow {
  id: string;
  doorNo: string;
  floor: number | null;
  areaSqm: Dec | null;
  landShare: Dec | null;
  unitTypeId: string | null;
  unitType: UnitType | null;
  occupants: Occupant[];
  debtor: string | null;
  occupied: boolean;
  balance: Dec;
}

export interface SiteDetail extends Site {
  blocks: { id: string; name: string; units: UnitRow[] }[];
}

export interface FinanceItem {
  id: string;
  name: string;
  kind: 'INCOME' | 'EXPENSE' | 'CHARGE';
  active: boolean;
  isDefault: boolean;
  description: string | null;
}

export interface PaymentAccount {
  id: string;
  kind: 'CASH' | 'BANK';
  name: string;
  currency: string;
  siteId: string | null;
  site: { id: string; name: string } | null;
  iban: string | null;
  openingBalance: Dec;
  active: boolean;
  description: string | null;
  balance: Dec;
  totalIn: Dec;
  totalOut: Dec;
}

export interface CurrentAccount {
  id: string;
  kind: 'SUPPLIER' | 'CUSTOMER' | 'OTHER';
  title: string;
  taxOffice: string | null;
  taxNo: string | null;
  tckn: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  active: boolean;
}

export interface CashTx {
  id: string;
  direction: 'IN' | 'OUT';
  source: 'COLLECTION' | 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVOICE_PAYMENT';
  amount: Dec;
  date: string;
  description: string | null;
  paymentAccount?: { name: string; kind: string };
  financeItem?: { name: string } | null;
  currentAccount?: { title: string } | null;
  site?: { name: string } | null;
  balance?: Dec;
}

export interface LedgerRow {
  id: string;
  kind: 'CHARGE' | 'PAYMENT';
  date: string;
  dueDate: string | null;
  description: string;
  debit: Dec;
  credit: Dec;
  remaining: Dec;
  lateFee: Dec;
  balance: Dec;
}

export interface Ledger {
  unit: { id: string; label: string; siteId: string; siteName: string };
  summary: { balance: Dec; totalDebit: Dec; totalCredit: Dec; due: Dec; advance: Dec; lateFee: Dec };
  rows: LedgerRow[];
}

export const SOURCE_LABEL: Record<CashTx['source'], string> = {
  COLLECTION: 'Tahsilat',
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
  TRANSFER: 'Virman',
  INVOICE_PAYMENT: 'Fatura ödemesi',
};

export const KIND_LABEL: Record<FinanceItem['kind'], string> = { INCOME: 'Gelir', EXPENSE: 'Gider', CHARGE: 'Borçlandırma' };

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';
export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: 'amber' | 'blue' | 'green' }> = {
  OPEN: { label: 'Açık', tone: 'amber' },
  IN_PROGRESS: { label: 'İşlemde', tone: 'blue' },
  DONE: { label: 'Tamamlandı', tone: 'green' },
};
