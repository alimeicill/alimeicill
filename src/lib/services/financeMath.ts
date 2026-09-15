import { 
  VatCalculation, 
  PayrollEngine, 
  AccountingVoucher, 
  AccountingVoucherLine, 
  VoucherType 
} from '@/types/advanced-finance';

/**
 * Standard Financial Rounding (ROUND_HALF_UP, 2 decimals)
 */
export function roundHalfUp(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Bi-directional VAT Calculator (%1, %10, %20 etc.)
 */
export function calculateVat(amount: number, rate: number, inclusive: boolean): VatCalculation {
  const safeAmount = Math.max(0, amount);
  const vatRateFraction = rate / 100;

  let netAmount = 0;
  let vatAmount = 0;
  let totalAmount = 0;

  if (inclusive) {
    totalAmount = roundHalfUp(safeAmount);
    netAmount = roundHalfUp(totalAmount / (1 + vatRateFraction));
    vatAmount = roundHalfUp(totalAmount - netAmount);
  } else {
    netAmount = roundHalfUp(safeAmount);
    vatAmount = roundHalfUp(netAmount * vatRateFraction);
    totalAmount = roundHalfUp(netAmount + vatAmount);
  }

  return {
    amount: safeAmount,
    rate,
    inclusive,
    netAmount,
    vatAmount,
    totalAmount
  };
}

/**
 * Payroll Calculation Engine (Bordro, SGK, Kıdem/İhbar Tazminatı, Huzur Hakkı)
 */
export function calculatePayroll(
  grossSalary: number,
  attendanceDays: number = 30,
  workYears: number = 0,
  isNotice: boolean = false,
  huzurHakki: number = 0
): PayrollEngine {
  const dailyGross = grossSalary / 30;
  const actualGross = roundHalfUp(dailyGross * attendanceDays);

  // SGK Shares
  const sgkEmployeeShare = roundHalfUp(actualGross * 0.14);
  const sgkEmployerShare = roundHalfUp(actualGross * 0.155); // 5% incentive applied

  // Taxable Income Base
  const taxBase = roundHalfUp(actualGross - sgkEmployeeShare);

  // Income Tax (15% standard bracket)
  const incomeTax = roundHalfUp(taxBase * 0.15);

  // Stamp Tax (0.00759 rate)
  const stampTax = roundHalfUp(actualGross * 0.00759);

  // Net Salary
  const netSalary = roundHalfUp(actualGross - sgkEmployeeShare - incomeTax - stampTax + huzurHakki);

  // Seniority Pay (Kıdem Tazminatı) - Cap 2026 = 46,054.36 TL
  const SENIORITY_CAP_2026 = 46054.36;
  const eligibleBase = Math.min(grossSalary, SENIORITY_CAP_2026);
  const seniorityBonus = workYears >= 1 ? roundHalfUp(eligibleBase * workYears) : 0;

  // Notice Pay (İhbar Tazminatı) - 4 weeks default for 1-3 years
  const noticeWeeks = workYears < 1 ? 2 : workYears < 3 ? 4 : 6;
  const noticePay = isNotice ? roundHalfUp((grossSalary / 30) * (noticeWeeks * 7)) : 0;

  // Total Cost to Employer
  const totalEmployerCost = roundHalfUp(actualGross + sgkEmployerShare + huzurHakki + seniorityBonus + noticePay);

  return {
    employeeId: '',
    employeeName: '',
    title: '',
    grossSalary,
    sgkEmployerShare,
    sgkEmployeeShare,
    incomeTax,
    stampTax,
    netSalary,
    attendanceDays,
    seniorityPayCap: SENIORITY_CAP_2026,
    seniorityBonus,
    noticePay,
    huzurHakki,
    totalEmployerCost
  };
}

/**
 * Legal Interest & Lawyer Fee Engine for Enforcement Proceedings
 */
export function calculateLegalInterest(
  principal: number,
  overdueDays: number,
  annualInterestRate: number = 24,
  lawyerFeeRate: number = 10
) {
  const dailyRate = annualInterestRate / 365 / 100;
  const interestAmount = roundHalfUp(principal * dailyRate * overdueDays);
  const lawyerFee = roundHalfUp((principal + interestAmount) * (lawyerFeeRate / 100));
  const totalAmount = roundHalfUp(principal + interestAmount + lawyerFee);

  return {
    principal: roundHalfUp(principal),
    overdueDays,
    interestAmount,
    lawyerFee,
    totalAmount
  };
}

/**
 * Accounting Voucher Engine (Mahsup, Tahsil, Tediye)
 */
export function generateAccountingVoucher(
  type: VoucherType,
  description: string,
  lines: AccountingVoucherLine[]
): AccountingVoucher {
  const totalDebit = roundHalfUp(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = roundHalfUp(lines.reduce((s, l) => s + l.credit, 0));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    id: `vch-${Date.now()}`,
    voucherNo: `YEV-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split('T')[0],
    type,
    description,
    lines,
    totalDebit,
    totalCredit,
    isBalanced
  };
}

/**
 * Straight-line Depreciation Calculator for Fixed Assets
 */
export function calculateDepreciation(
  purchaseValue: number,
  usefulLifeYears: number,
  yearsElapsed: number
) {
  if (usefulLifeYears <= 0) {
    return { accumulatedDepreciation: 0, currentBookValue: purchaseValue };
  }

  const annualDepreciation = purchaseValue / usefulLifeYears;
  const accumulatedDepreciation = roundHalfUp(Math.min(purchaseValue, annualDepreciation * Math.min(yearsElapsed, usefulLifeYears)));
  const currentBookValue = roundHalfUp(Math.max(0, purchaseValue - accumulatedDepreciation));

  return {
    accumulatedDepreciation,
    currentBookValue
  };
}
