using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ApartmentManagement.Backend.Services
{
    public class BankTransaction
    {
        public string TransactionRef { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public decimal Amount { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class MatchResult
    {
        public bool IsMatched { get; set; }
        public string Status { get; set; } = "Beklemede"; // "Eslesti", "Manuel_Incelemede", "Beklemede"
        public string? MatchedResidentId { get; set; }
        public string? MatchCriteria { get; set; } // "TCNo", "Telefon", "Isim_Eslesmesi", "DaireKodu"
        public string Message { get; set; } = string.Empty;
    }

    public interface IBankSyncService
    {
        Task<MatchResult> ReconcileTransactionAsync(BankTransaction tx);
    }

    public class BankSyncService : IBankSyncService
    {
        public BankSyncService()
        {
        }

        // ============================================================
        // Akıllı Eşleştirme Motoru (Reconciliation Engine)
        // ============================================================
        public async Task<MatchResult> ReconcileTransactionAsync(BankTransaction tx)
        {
            // 1. Kriter: Daire Açıklama Kodu Analizi (Regex)
            // Açıklama alanında "A-101", "A/12", "B Blok Daire 4" araması yapar.
            var daireMatch = Regex.Match(tx.Description, @"(?i)(A|B)\s?(-|/)?\s?\d+");
            if (daireMatch.Success)
            {
                string daireKodu = daireMatch.Value.ToUpper().Replace(" ", "");
                Console.WriteLine($"[MUTABAKAT] Daire Kodu tespit edildi: {daireKodu}");
                
                return new MatchResult
                {
                    IsMatched = true,
                    Status = "Eslesti",
                    MatchedResidentId = "res-user-102", // Simüle edilmiş eşleşen sakin
                    MatchCriteria = "DaireKodu",
                    Message = $"'{daireKodu}' Daire Kodu ile otomatik eşleştirildi."
                };
            }

            // 2. Kriter: T.C. Kimlik Numarası Eşleşmesi
            // Açıklamada 11 haneli sayısal değer arar.
            var tcMatch = Regex.Match(tx.Description, @"\b\d{11}\b");
            if (tcMatch.Success)
            {
                string tcNo = tcMatch.Value;
                Console.WriteLine($"[MUTABAKAT] 11 Haneli T.C. No tespit edildi: {tcNo}");
                
                // TC Numarasını şifrelenmiş kolonlarla eşleştir
                return new MatchResult
                {
                    IsMatched = true,
                    Status = "Eslesti",
                    MatchedResidentId = "res-user-105",
                    MatchCriteria = "TCNo",
                    Message = "TC Kimlik numarası eşleşmesi ile otomatik kapatıldı."
                };
            }

            // 3. Kriter: Telefon Numarası Eşleşmesi
            // Açıklama içinde 10 veya 11 haneli telefon numarası kontrolü.
            var phoneMatch = Regex.Match(tx.Description, @"\b(05|5)\d{9}\b");
            if (phoneMatch.Success)
            {
                string phone = phoneMatch.Value;
                Console.WriteLine($"[MUTABAKAT] Telefon No tespit edildi: {phone}");
                
                return new MatchResult
                {
                    IsMatched = true,
                    Status = "Eslesti",
                    MatchedResidentId = "res-user-109",
                    MatchCriteria = "Telefon",
                    Message = "Telefon numarası eşleşmesi ile otomatik kapatıldı."
                };
            }

            // 4. Kriter: İsim Benzerliği Analizi
            // Gönderen hesap adı ile sakinler listesi karşılaştırılır (Levenshtein algoritması simülasyonu)
            if (tx.SenderName.Contains("Ahmet Yılmaz") || tx.SenderName.Contains("Mehmet Kaya"))
            {
                return new MatchResult
                {
                    IsMatched = true,
                    Status = "Eslesti",
                    MatchedResidentId = "res-user-101",
                    MatchCriteria = "Isim_Eslesmesi",
                    Message = $"Gönderen '{tx.SenderName}' ile Sakin ismi eşleşti."
                };
            }

            // Hiçbiri eşleşmezse manuel incelemeye at
            Console.WriteLine($"[MUTABAKAT] Eşleşme Bulunamadı. Manuel incelemeye yönlendiriliyor: {tx.SenderName}");
            return new MatchResult
            {
                IsMatched = false,
                Status = "Manuel_Incelemede",
                MatchedResidentId = null,
                MatchCriteria = null,
                Message = "Otomatik eşleşme kriteri bulunamadı. Manuel eşleştirme gerekli."
            };
        }
    }
}
