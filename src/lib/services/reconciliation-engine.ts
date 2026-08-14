export interface MatchResult {
  isMatched: boolean;
  status: 'MATCHED_AUTO' | 'UNMATCHED';
  matchedResidentId: string | null;
  matchedApartmentId: string | null;
  matchCriteria: 'TCNo' | 'Telefon' | 'Isim_Eslesmesi' | 'DaireKodu' | null;
  confidenceScore: number;
  message: string;
}

export class ReconciliationEngine {
  /**
   * Banka işlem hareketini kayıtlı sakin ve daire bilgileriyle otomatik olarak eşleştirir.
   */
  static reconcile(
    description: string,
    senderName: string = '',
    residents: any[], // array of prisma resident with user detail
    apartments: any[] // array of prisma apartment with blocks
  ): MatchResult {
    const descUpper = description.toUpperCase();
    const senderUpper = senderName.toUpperCase();

    // 1. Kriter: Daire Açıklama Kodu Analizi (Regex)
    // Açıklamada "A-12", "A/1", "B Blok Daire 5" araması yapar.
    const daireRegex = /(A|B)\s?(-|\/)?\s?\d+/i;
    const daireMatch = description.match(daireRegex);
    if (daireMatch) {
      let matchedStr = daireMatch[0].toUpperCase().replace(/\s/g, ''); // "A-12" veya "B/5"
      // Standart formata dönüştür: "B/5" -> "B-5", "B5" -> "B-5"
      if (!matchedStr.includes('-')) {
        matchedStr = matchedStr.replace('/', '-');
        if (!matchedStr.includes('-')) {
          matchedStr = matchedStr.substring(0, 1) + '-' + matchedStr.substring(1);
        }
      }

      // Standart koda göre daireyi bul
      const foundApt = apartments.find(apt => {
        const aptCode = `${apt.block.name.charAt(0)}-${apt.number}`; // e.g. "A-12"
        return aptCode.toUpperCase() === matchedStr;
      });

      if (foundApt) {
        // Dairenin aktif sakini var mı bul
        const activeResident = foundApt.residents?.[0]?.user;
        return {
          isMatched: true,
          status: 'MATCHED_AUTO',
          matchedResidentId: activeResident?.id || null,
          matchedApartmentId: foundApt.id,
          matchCriteria: 'DaireKodu',
          confidenceScore: 100,
          message: `'${matchedStr}' Daire Kodu eşleşmesi tespit edildi.`
        };
      }
    }

    // 2. Kriter: T.C. Kimlik Numarası Eşleşmesi
    // Açıklamada veya gönderici adında 11 haneli sayısal TC numarası ara
    const tcRegex = /\b\d{11}\b/;
    const tcMatch = (description + ' ' + senderName).match(tcRegex);
    if (tcMatch) {
      const tcNo = tcMatch[0];
      const foundResident = residents.find(res => res.nationalId === tcNo);
      if (foundResident) {
        // Sakinin dairesini bul
        const linkedApt = foundResident.user?.apartments?.[0]?.apartmentId;
        return {
          isMatched: true,
          status: 'MATCHED_AUTO',
          matchedResidentId: foundResident.userId,
          matchedApartmentId: linkedApt || null,
          matchCriteria: 'TCNo',
          confidenceScore: 95,
          message: 'T.C. Kimlik numarası doğrulaması eşleşti.'
        };
      }
    }

    // 3. Kriter: Telefon Numarası Eşleşmesi
    // Açıklamada 10-11 haneli gsm numarası ara (05xxxxxxxxx veya 5xxxxxxxxx)
    const phoneRegex = /\b(05|5)\d{9}\b/;
    const phoneMatch = (description + ' ' + senderName).match(phoneRegex);
    if (phoneMatch) {
      let phoneNo = phoneMatch[0];
      if (phoneNo.startsWith('0')) {
        phoneNo = phoneNo.substring(1); // standarta çek: 5xxxxxxxxx
      }
      
      const foundResident = residents.find(res => {
        const userPhone = res.user?.phone || '';
        return userPhone.replace(/\D/g, '').endsWith(phoneNo);
      });

      if (foundResident) {
        const linkedApt = foundResident.user?.apartments?.[0]?.apartmentId;
        return {
          isMatched: true,
          status: 'MATCHED_AUTO',
          matchedResidentId: foundResident.userId,
          matchedApartmentId: linkedApt || null,
          matchCriteria: 'Telefon',
          confidenceScore: 90,
          message: 'Telefon numarası doğrulaması eşleşti.'
        };
      }
    }

    // 4. Kriter: İsim Benzerliği Analizi
    // Gönderici adı ile kayıtlı sakinlerin isimlerini karşılaştır
    if (senderUpper.trim()) {
      for (const res of residents) {
        const resName = (res.user?.name || '').toUpperCase();
        if (resName && (senderUpper.includes(resName) || resName.includes(senderUpper))) {
          const linkedApt = res.user?.apartments?.[0]?.apartmentId;
          return {
            isMatched: true,
            status: 'MATCHED_AUTO',
            matchedResidentId: res.userId,
            matchedApartmentId: linkedApt || null,
            matchCriteria: 'Isim_Eslesmesi',
            confidenceScore: 75,
            message: `Gönderen '${senderName}' ile Sakin ismi '${res.user?.name}' eşleşti.`
          };
        }
      }
    }

    // 5. Eşleşme Bulunamadı
    return {
      isMatched: false,
      status: 'UNMATCHED',
      matchedResidentId: null,
      matchedApartmentId: null,
      matchCriteria: null,
      confidenceScore: 0,
      message: 'Otomatik eşleşme kriteri bulunamadı. Manuel eşleştirme gerekli.'
    };
  }
}
export type BankMovementClassification = 'MEMBER_COLLECTION' | 'EXTERNAL_COLLECTION' | 'EXPENSE_PAYMENT' | 'VENDOR_PAYMENT' | 'STAFF_PAYMENT' | 'TRANSFER';
export type BankMovementStatus = 'UNMATCHED' | 'MATCHED_AUTO' | 'MATCHED_MANUAL' | 'ROLLBACKED';
