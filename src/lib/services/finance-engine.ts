export enum DistributionType {
  EQUAL = "EQUAL",
  SQUARE_METER = "SQUARE_METER",
  SHARE = "SHARE",
  FIXED = "FIXED"
}

export interface Daire {
  daireId: string;
  daireNo: string;
  m2: number;
  arsaPayi: number;
  sabitAidat?: number;
}

// ROUND_HALF_UP rounding utility matching Python's Decimal behavior
export function roundHalfUp(val: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  const eps = 1e-12; // Epsilon to handle javascript float representation inaccuracy
  return Math.round((val + eps) * multiplier) / multiplier;
}

export class BorclandirmaEngine {
  /**
   * Dairelerin payına düşen aidat tutarlarını hesaplar.
   */
  static aidatHesapla(
    daireler: Daire[],
    toplamButce: number,
    dagitimTipi: DistributionType
  ): Record<string, number> {
    const sonuclar: Record<string, number> = {};

    if (dagitimTipi === DistributionType.EQUAL) {
      const aktifDaireSayisi = daireler.length;
      if (aktifDaireSayisi === 0) return sonuclar;
      
      const birimTutari = roundHalfUp(toplamButce / aktifDaireSayisi);
      for (const d of daireler) {
        sonuclar[d.daireId] = birimTutari;
      }
    } 
    
    else if (dagitimTipi === DistributionType.SQUARE_METER) {
      const toplamM2 = daireler.reduce((sum, d) => sum + d.m2, 0);
      if (toplamM2 === 0) return sonuclar;

      for (const d of daireler) {
        const oranti = d.m2 / toplamM2;
        const tutar = roundHalfUp(toplamButce * oranti);
        sonuclar[d.daireId] = tutar;
      }
    } 
    
    else if (dagitimTipi === DistributionType.SHARE) {
      const toplamPay = daireler.reduce((sum, d) => sum + d.arsaPayi, 0);
      if (toplamPay === 0) return sonuclar;

      for (const d of daireler) {
        const oranti = d.arsaPayi / toplamPay;
        const tutar = roundHalfUp(toplamButce * oranti);
        sonuclar[d.daireId] = tutar;
      }
    } 
    
    else if (dagitimTipi === DistributionType.FIXED) {
      for (const d of daireler) {
        sonuclar[d.daireId] = roundHalfUp(d.sabitAidat || 0);
      }
    }

    return sonuclar;
  }
}

export class GecikmeFaiziEngine {
  /**
   * Vadesi geçmiş borçlar için günlük veya aylık gecikme tazminatı hesaplar.
   */
  static faizHesapla(
    kalanAnapara: number,
    sonOdemeTarihi: Date,
    hesaplamaTarihi: Date,
    aylikFaizOrani: number = 5.0, // Varsayılan %5 aylık gecikme faizi (KMK)
    gunlukFaizMi: boolean = true
  ) {
    if (hesaplamaTarihi <= sonOdemeTarihi || kalanAnapara <= 0) {
      return {
        gecikenGun: 0,
        faizTutari: 0,
        toplamBorc: kalanAnapara
      };
    }

    const diffTime = hesaplamaTarihi.getTime() - sonOdemeTarihi.getTime();
    const gecikenGun = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (gecikenGun <= 0) {
      return {
        gecikenGun: 0,
        faizTutari: 0,
        toplamBorc: kalanAnapara
      };
    }

    let faizTutari = 0;

    if (gunlukFaizMi) {
      // Günlük esnek faiz: (Anapara * (Aylık Oran / 100 / 30)) * Gün Sayısı
      const gunlukOran = (aylikFaizOrani / 100) / 30;
      faizTutari = kalanAnapara * gunlukOran * gecikenGun;
    } else {
      // Tam ay hesabı
      const aySayisi = gecikenGun / 30;
      faizTutari = kalanAnapara * (aylikFaizOrani / 100) * aySayisi;
    }

    faizTutari = roundHalfUp(faizTutari);

    return {
      gecikenGun,
      faizTutari,
      toplamBorc: roundHalfUp(kalanAnapara + faizTutari)
    };
  }
}
