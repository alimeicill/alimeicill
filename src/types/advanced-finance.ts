export interface VatCalculation {
  amount: number;
  rate: number; // e.g., 1, 10, 20
  inclusive: boolean;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ResidentFinance {
  residentId: string;
  residentName: string;
  apartmentNo: string;
  currentBalance: number;
  overdueInstallmentsCount: number;
  totalOverdueAmount: number;
  pastPayments: {
    id: string;
    date: string;
    amount: number;
    description: string;
    receiptNo: string;
  }[];
  statementEntries: {
    id: string;
    date: string;
    type: 'DEBIT' | 'CREDIT';
    description: string;
    amount: number;
    balanceAfter: number;
  }[];
}

export interface PayrollEngine {
  employeeId: string;
  employeeName: string;
  title: string;
  grossSalary: number;
  sgkEmployerShare: number;
  sgkEmployeeShare: number;
  incomeTax: number;
  stampTax: number;
  netSalary: number;
  attendanceDays: number;
  seniorityPayCap: number; // Kıdem Tazminatı Tavanı
  seniorityBonus: number; // Kıdem Tazminatı Tutarı
  noticePay: number; // İhbar Tazminatı
  huzurHakki: number; // Board Member Attendance Fee
  totalEmployerCost: number;
}

export interface AccountingVoucherLine {
  accountCode: string;
  accountName: string;
  debit: number; // Borç
  credit: number; // Alacak
  description: string;
}

export type VoucherType = 'MAHSUP' | 'TAHSIL' | 'TEDIYE';

export interface AccountingVoucher {
  id: string;
  voucherNo: string;
  date: string;
  type: VoucherType;
  description: string;
  lines: AccountingVoucherLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface AccountPlanItem {
  code: string;
  name: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
  type: 'DEBIT' | 'CREDIT';
}

export interface LegalProcess {
  id: string;
  residentId: string;
  residentName: string;
  apartmentNo: string;
  overdueDays: number;
  principalAmount: number;
  legalInterest: number; // Yasal faiz
  lawyerFee: number; // Avukat / Masraf
  totalExecutionAmount: number; // Toplam İcra Föyü Tutarı
  status: 'CANDIDATE' | 'FILED' | 'IN_ENFORCEMENT' | 'SETTLED';
  filedDate?: string;
  fileNo?: string;
}

export interface VirtualPosTransaction {
  id: string;
  residentId: string;
  cardNumberMasked: string;
  amount: number;
  installments: number;
  status: 'SUCCESS' | 'FAILED';
  transactionDate: string;
  authCode: string;
}

export interface BusinessProjectBudget {
  period: string; // e.g. "2026 Bütçesi"
  categories: {
    name: string;
    plannedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  }[];
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
}

export interface CheckNoteItem {
  id: string;
  type: 'CHECK' | 'NOTE';
  documentNo: string;
  dueDate: string;
  drawer: string; // Ciranta / Keşideci
  amount: number;
  status: 'PORTFOLIO' | 'COLLECTED' | 'BOUNCED' | 'ENDORSED';
}

export interface AssetItem {
  id: string;
  code: string;
  name: string;
  purchaseDate: string;
  purchaseValue: number;
  usefulLifeYears: number;
  depreciationRate: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
}

export interface ContractItem {
  id: string;
  vendorName: string;
  serviceType: 'SECURITY' | 'CLEANING' | 'ELEVATOR' | 'GARDEN' | 'MANAGEMENT';
  startDate: string;
  endDate: string;
  monthlyFee: number;
  daysRemaining: number;
  status: 'ACTIVE' | 'WARNING' | 'EXPIRED';
}
