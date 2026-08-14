export interface RawTransaction {
  transactionRef: string;
  transactionDate: Date;
  amount: number;
  senderName?: string;
  description: string;
}

export interface IBankAdapter {
  fetchTransactions(bankAccountId: string): Promise<RawTransaction[]>;
}

export class GarantiBankAdapter implements IBankAdapter {
  async fetchTransactions(bankAccountId: string): Promise<RawTransaction[]> {
    // Simulated Bank Web Service call response
    console.log(`[BANK_API] Garanti BBVA Web Servisi çağrılıyor. Banka hesap ID: ${bankAccountId}`);
    return [
      {
        transactionRef: `GT${Math.floor(100000 + Math.random() * 900000)}`,
        transactionDate: new Date(),
        amount: 1500.00,
        senderName: 'Ahmet Yılmaz',
        description: 'A-1 HAZİRAN AİDAT ÖDEMESİ'
      },
      {
        transactionRef: `GT${Math.floor(100000 + Math.random() * 900000)}`,
        transactionDate: new Date(),
        amount: 6200.00,
        senderName: 'Fatma Arslan',
        description: 'B-2 ENTEGRE AİDAT'
      }
    ];
  }
}

export class AkbankAdapter implements IBankAdapter {
  async fetchTransactions(bankAccountId: string): Promise<RawTransaction[]> {
    console.log(`[BANK_API] Akbank Web Servisi çağrılıyor. Banka hesap ID: ${bankAccountId}`);
    return [
      {
        transactionRef: `AK${Math.floor(100000 + Math.random() * 900000)}`,
        transactionDate: new Date(),
        amount: 240.00,
        senderName: 'Ali Yıldırım',
        description: 'B-1 ELEKTRIK FARK'
      },
      {
        transactionRef: `AK${Math.floor(100000 + Math.random() * 900000)}`,
        transactionDate: new Date(Date.now() - 3600000),
        amount: 3000.00,
        senderName: 'Zeynep Kaya',
        description: 'TCK: 12345678901' // TC Match criteria
      }
    ];
  }
}

export class ZiraatBankAdapter implements IBankAdapter {
  async fetchTransactions(bankAccountId: string): Promise<RawTransaction[]> {
    console.log(`[BANK_API] Ziraat Bankası Web Servisi çağrılıyor. Banka hesap ID: ${bankAccountId}`);
    return [
      {
        transactionRef: `ZR${Math.floor(100000 + Math.random() * 900000)}`,
        transactionDate: new Date(),
        amount: 4500.00,
        senderName: 'MEHMET KAYA',
        description: 'Gsm: 05321112233' // Phone match criteria
      },
      {
        transactionRef: `ZR${Math.floor(100000 + Math.random() * 900000)}`,
        transactionDate: new Date(),
        amount: 750.00,
        senderName: 'KEMAL YURT',
        description: 'HAZİRAN GENEL ÖDEME' // Unmatched criteria
      }
    ];
  }
}

export class BankAdapterFactory {
  static getAdapter(provider: string): IBankAdapter {
    switch (provider.toUpperCase()) {
      case 'GARANTI':
      case 'GARANTI_BBVA':
        return new GarantiBankAdapter();
      case 'AKBANK':
        return new AkbankAdapter();
      case 'ZIRAAT':
        return new ZiraatBankAdapter();
      default:
        throw new Error(`Geçersiz veya desteklenmeyen banka sağlayıcısı: ${provider}`);
    }
  }
}
