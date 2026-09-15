import { 
  ResidentFinance, 
  PayrollEngine, 
  AccountingVoucher, 
  AccountPlanItem, 
  LegalProcess, 
  VirtualPosTransaction, 
  BusinessProjectBudget, 
  CheckNoteItem, 
  AssetItem, 
  ContractItem 
} from '@/types/advanced-finance';
import { calculatePayroll, calculateLegalInterest, generateAccountingVoucher, calculateDepreciation } from './financeMath';

export class AdvancedFinanceService {
  /**
   * Mock / Local Storage Data for Residents Finance
   */
  static getResidentFinances(): ResidentFinance[] {
    return [
      {
        residentId: 'res-1',
        residentName: 'Ahmet Yılmaz',
        apartmentNo: 'A-1',
        currentBalance: 1500,
        overdueInstallmentsCount: 1,
        totalOverdueAmount: 1500,
        pastPayments: [
          { id: 'pay-101', date: '2026-05-15', amount: 1500, description: 'Mayıs Aidatı', receiptNo: 'MAK-901' },
          { id: 'pay-102', date: '2026-04-12', amount: 1500, description: 'Nisan Aidatı', receiptNo: 'MAK-820' }
        ],
        statementEntries: [
          { id: 'st-1', date: '2026-06-01', type: 'DEBIT', description: 'Haziran Aidat Tahakkuku', amount: 1500, balanceAfter: 1500 },
          { id: 'st-2', date: '2026-05-15', type: 'CREDIT', description: 'Banka Havalesi Tahsilatı', amount: 1500, balanceAfter: 0 }
        ]
      },
      {
        residentId: 'res-2',
        residentName: 'Zeynep Kaya',
        apartmentNo: 'A-3',
        currentBalance: 4500,
        overdueInstallmentsCount: 3,
        totalOverdueAmount: 4500,
        pastPayments: [
          { id: 'pay-103', date: '2026-03-10', amount: 1500, description: 'Mart Aidatı', receiptNo: 'MAK-710' }
        ],
        statementEntries: [
          { id: 'st-3', date: '2026-06-01', type: 'DEBIT', description: 'Haziran Aidat Tahakkuku', amount: 1500, balanceAfter: 4500 },
          { id: 'st-4', date: '2026-05-01', type: 'DEBIT', description: 'Mayıs Aidat Tahakkuku', amount: 1500, balanceAfter: 3000 },
          { id: 'st-5', date: '2026-04-01', type: 'DEBIT', description: 'Nisan Aidat Tahakkuku', amount: 1500, balanceAfter: 1500 }
        ]
      },
      {
        residentId: 'res-3',
        residentName: 'Mustafa Şahin',
        apartmentNo: 'B-2',
        currentBalance: 6200,
        overdueInstallmentsCount: 4,
        totalOverdueAmount: 6200,
        pastPayments: [],
        statementEntries: [
          { id: 'st-6', date: '2026-06-01', type: 'DEBIT', description: 'Haziran Aidatı + Demirbaş Payı', amount: 6200, balanceAfter: 6200 }
        ]
      }
    ];
  }

  /**
   * Process Virtual POS Payment
   */
  static processVirtualPos(
    residentId: string,
    cardNumber: string,
    amount: number,
    installments: number
  ): VirtualPosTransaction {
    const maskedCard = `**** **** **** ${cardNumber.slice(-4)}`;
    const tx: VirtualPosTransaction = {
      id: `pos-${Date.now()}`,
      residentId,
      cardNumberMasked: maskedCard,
      amount,
      installments,
      status: 'SUCCESS',
      transactionDate: new Date().toISOString(),
      authCode: `AUTH${Math.floor(100000 + Math.random() * 900000)}`
    };

    // Update resident debt in LocalStorage mock
    const residents = this.getResidentFinances();
    const target = residents.find(r => r.residentId === residentId);
    if (target) {
      target.currentBalance = Math.max(0, target.currentBalance - amount);
      target.statementEntries.unshift({
        id: `st-pos-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'CREDIT',
        description: `Sanal POS Ödemesi (${installments} Taksit) Auth: ${tx.authCode}`,
        amount,
        balanceAfter: target.currentBalance
      });
      localStorage.setItem('site_resident_finances', JSON.stringify(residents));
    }

    return tx;
  }

  /**
   * Legal Enforcement Candidates (Overdue 60+ Days)
   */
  static getLegalProcesses(): LegalProcess[] {
    const residents = this.getResidentFinances();
    
    return residents
      .filter(r => r.overdueInstallmentsCount >= 2 || r.totalOverdueAmount >= 4000)
      .map(r => {
        const overdueDays = r.overdueInstallmentsCount * 30 + 15;
        const interest = calculateLegalInterest(r.totalOverdueAmount, overdueDays);

        return {
          id: `leg-${r.residentId}`,
          residentId: r.residentId,
          residentName: r.residentName,
          apartmentNo: r.apartmentNo,
          overdueDays,
          principalAmount: r.totalOverdueAmount,
          legalInterest: interest.interestAmount,
          lawyerFee: interest.lawyerFee,
          totalExecutionAmount: interest.totalAmount,
          status: overdueDays >= 90 ? 'IN_ENFORCEMENT' : 'CANDIDATE',
          filedDate: overdueDays >= 90 ? '2026-05-10' : undefined,
          fileNo: overdueDays >= 90 ? '2026/14582 Esas' : undefined
        };
      });
  }

  /**
   * Uniform Chart of Accounts (Tek Düzen Hesap Planı)
   */
  static getChartOfAccounts(): AccountPlanItem[] {
    return [
      { code: '100', name: 'KASA HESABI', category: 'ASSET', balance: 45200.00, type: 'DEBIT' },
      { code: '102', name: 'BANKALAR HESABI (GARANTİ/AKBANK)', category: 'ASSET', balance: 185400.00, type: 'DEBIT' },
      { code: '120', name: 'ALICILAR (AİDAT BORÇLULARI)', category: 'ASSET', balance: 12200.00, type: 'DEBIT' },
      { code: '320', name: 'SATICILAR (TEDARİKÇİ & FİRMALAR)', category: 'LIABILITY', balance: 18500.00, type: 'CREDIT' },
      { code: '600', name: 'YURTİÇİ SATIŞLAR (AİDAT GELİRLERİ)', category: 'REVENUE', balance: 220000.00, type: 'CREDIT' },
      { code: '770', name: 'GENEL YÖNETİM GİDERLERİ', category: 'EXPENSE', balance: 84000.00, type: 'DEBIT' }
    ];
  }

  /**
   * Get Accounting Vouchers List
   */
  static getAccountingVouchers(): AccountingVoucher[] {
    return [
      generateAccountingVoucher('TAHSIL', 'Ahmet Yılmaz A-1 Haziran Aidat Tahsilatı', [
        { accountCode: '102', accountName: 'BANKALAR HESABI', debit: 1500, credit: 0, description: 'Garanti Bankası Havale' },
        { accountCode: '120', accountName: 'ALICILAR (SITESAKINLERI)', debit: 0, credit: 1500, description: 'A-1 Ahmet Yılmaz Borç Kapatma' }
      ]),
      generateAccountingVoucher('TEDIYE', 'Elektrik Faturası Ödemesi', [
        { accountCode: '770', accountName: 'GENEL YÖNETİM GİDERLERİ', debit: 4200, credit: 0, description: 'Ortak Alan Elektrik' },
        { accountCode: '102', accountName: 'BANKALAR HESABI', debit: 0, credit: 4200, description: 'Banka Otomatik Ödeme' }
      ]),
      generateAccountingVoucher('MAHSUP', 'Haziran Ayı Personel Maaş Tahakkuku', [
        { accountCode: '770', accountName: 'GENEL YÖNETİM GİDERLERİ (PERSONEL)', debit: 32500, credit: 0, description: 'Brüt Maaş + SGK İşveren' },
        { accountCode: '335', accountName: 'PERSONELE BORÇLAR', debit: 0, credit: 24000, description: 'Net Ödenecek Maaş' },
        { accountCode: '360', accountName: 'ÖDENECEK VERGİ VE FONLAR', debit: 0, credit: 8500, description: 'SGK + Stopaj Kesintisi' }
      ])
    ];
  }

  /**
   * Personnel Payroll List
   */
  static getPersonnelList(): PayrollEngine[] {
    const p1 = calculatePayroll(30000, 30, 2, false, 0);
    p1.employeeId = 'emp-1';
    p1.employeeName = 'Murat Usta';
    p1.title = 'Teknik & Asansör Sorumlusu';

    const p2 = calculatePayroll(24000, 30, 1, false, 0);
    p2.employeeId = 'emp-2';
    p2.employeeName = 'Ayşe Yılmaz';
    p2.title = 'Temizlik & Kat Görevlisi';

    return [p1, p2];
  }

  /**
   * Business Project (Budget Variance Analysis)
   */
  static getBusinessProjectBudget(): BusinessProjectBudget {
    const categories = [
      { name: 'Personel & SGK Giderleri', plannedAmount: 380000, actualAmount: 392000, variance: -12000, variancePercentage: -3.15 },
      { name: 'Ortak Alan Elektrik & Su', plannedAmount: 120000, actualAmount: 114000, variance: 6000, variancePercentage: 5.0 },
      { name: 'Asansör & Bakım Onarım', plannedAmount: 90000, actualAmount: 88000, variance: 2000, variancePercentage: 2.22 },
      { name: 'Güvenlik & Kamera Servis', plannedAmount: 150000, actualAmount: 150000, variance: 0, variancePercentage: 0.0 },
      { name: 'Peyzaj & Bahçe Bakımı', plannedAmount: 45000, actualAmount: 49000, variance: -4000, variancePercentage: -8.88 }
    ];

    const totalPlanned = categories.reduce((s, c) => s + c.plannedAmount, 0);
    const totalActual = categories.reduce((s, c) => s + c.actualAmount, 0);
    const totalVariance = totalPlanned - totalActual;

    return {
      period: '2026 Yılı İşletme Projesi Bütçesi',
      categories,
      totalPlanned,
      totalActual,
      totalVariance
    };
  }

  /**
   * Check & Note Portfolio
   */
  static getCheckNotes(): CheckNoteItem[] {
    return [
      { id: 'cn-1', type: 'CHECK', documentNo: 'CHK-998811', dueDate: '2026-07-15', drawer: 'Asansör Bakım A.Ş.', amount: 15000, status: 'PORTFOLIO' },
      { id: 'cn-2', type: 'NOTE', documentNo: 'SNT-443322', dueDate: '2026-08-01', drawer: 'Çevre Peyzaj Ltd.', amount: 8500, status: 'COLLECTED' }
    ];
  }

  /**
   * Asset Items & Depreciation
   */
  static getAssets(): AssetItem[] {
    const asset1 = calculateDepreciation(60000, 5, 2);
    const asset2 = calculateDepreciation(120000, 10, 3);

    return [
      {
        id: 'ast-1',
        code: 'DEM-001',
        name: 'Jeneratör Seti (100 kVA)',
        purchaseDate: '2024-01-10',
        purchaseValue: 60000,
        usefulLifeYears: 5,
        depreciationRate: 20,
        accumulatedDepreciation: asset1.accumulatedDepreciation,
        currentBookValue: asset1.currentBookValue
      },
      {
        id: 'ast-2',
        code: 'DEM-002',
        name: 'Güvenlik Kamera & NVR Sistemi',
        purchaseDate: '2023-05-20',
        purchaseValue: 120000,
        usefulLifeYears: 10,
        depreciationRate: 10,
        accumulatedDepreciation: asset2.accumulatedDepreciation,
        currentBookValue: asset2.currentBookValue
      }
    ];
  }

  /**
   * Contracts Management
   */
  static getContracts(): ContractItem[] {
    return [
      { id: 'cnt-1', vendorName: 'Kaya Güvenlik A.Ş.', serviceType: 'SECURITY', startDate: '2025-06-01', endDate: '2026-06-01', monthlyFee: 18000, daysRemaining: 15, status: 'WARNING' },
      { id: 'cnt-[#E31B23]2', vendorName: 'Otis Asansör Sanayi', serviceType: 'ELEVATOR', startDate: '2026-01-01', endDate: '2026-12-31', monthlyFee: 7500, daysRemaining: 180, status: 'ACTIVE' },
      { id: 'cnt-3', vendorName: 'Yeşil Peyzaj Hizmetleri', serviceType: 'GARDEN', startDate: '2025-03-01', endDate: '2026-03-01', monthlyFee: 4500, daysRemaining: 0, status: 'EXPIRED' }
    ];
  }
}
