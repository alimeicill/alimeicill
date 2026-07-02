using System;
using System.Threading.Tasks;
using ApartmentManagement.Backend.Models;

namespace ApartmentManagement.Backend.Services
{
    public interface IPaymentAccountService
    {
        Task<bool> PostTransactionAsync(
            string accountId, 
            TransactionType type, 
            decimal amount, 
            string direction, 
            string description, 
            string userId, 
            string? relatedAccountId = null, 
            string? relatedPersonId = null, 
            string? docUrl = null
        );

        Task<bool> ExecuteTransferAsync(
            string sourceAccountId, 
            string targetAccountId, 
            decimal amount, 
            string description, 
            string userId
        );
    }

    public class PaymentAccountService : IPaymentAccountService
    {
        // private readonly ApplicationDbContext _dbContext; // Entity Framework Core DbContext

        public PaymentAccountService()
        {
        }

        // ==========================================
        // 1. Hesap Hareketi Ekleme ve Bakiye Güncelleme
        // ==========================================
        public async Task<bool> PostTransactionAsync(
            string accountId, 
            TransactionType type, 
            decimal amount, 
            string direction, 
            string description, 
            string userId, 
            string? relatedAccountId = null, 
            string? relatedPersonId = null, 
            string? docUrl = null
        )
        {
            try
            {
                // Örnek EF Core sorgusu ve güncellemesi:
                // var account = await _dbContext.PaymentAccounts.FindAsync(accountId);
                // if (account == null) return false;

                // Eksi Bakiye Kontrolü (Görsel uyarı için eksiye düşmeye izin verir fakat loga yazar)
                // if (direction == "cikis" && account.Balance < amount) {
                //     Console.WriteLine($"UYARI: {account.Name} hesabı bakiye yetersiz! Bakiye: {account.Balance}, Çıkış: {amount}");
                // }

                // Bakiye Güncelleme
                // if (direction == "giris") account.Balance += amount;
                // else account.Balance -= amount;

                // Hareket Logu Ekleme
                var transaction = new AccountTransaction
                {
                    AccountId = accountId,
                    Type = type,
                    Amount = amount,
                    Direction = direction,
                    RelatedAccountId = relatedAccountId,
                    Description = description,
                    RelatedPersonId = relatedPersonId,
                    DocumentUrl = docUrl,
                    TransactionDate = DateTime.Now,
                    CreatedAt = DateTime.Now,
                    CreatedBy = userId
                };

                // await _dbContext.AccountTransactions.AddAsync(transaction);
                // await _dbContext.SaveChangesAsync();

                Console.WriteLine($"İşlem Başarılı: {direction.ToUpper()} - Tutar={amount:F2} TL, Hesap={accountId}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hesap hareketi ekleme hatası: {ex.Message}");
                return false;
            }
        }

        // ==========================================
        // 2. Çift Taraflı Virman (Para Transferi) - Atomik İşlem
        // ==========================================
        public async Task<bool> ExecuteTransferAsync(
            string sourceAccountId, 
            string targetAccountId, 
            decimal amount, 
            string description, 
            string userId
        )
        {
            if (sourceAccountId == targetAccountId)
            {
                return false;
            }

            // Entity Framework Core transaction bloğu simülasyonu
            // using (var dbTx = await _dbContext.Database.BeginTransactionAsync())
            try
            {
                // 1. Kaynak hesaptan para çıkışı (VIRMAN_CIKIS)
                var sourceResult = await PostTransactionAsync(
                    sourceAccountId,
                    TransactionType.VIRMAN_CIKIS,
                    amount,
                    "cikis",
                    $"{description} (Hedef Hesap: {targetAccountId})",
                    userId,
                    targetAccountId
                );

                if (!sourceResult)
                {
                    throw new Exception("Virman çıkış işlemi başarısız oldu.");
                }

                // 2. Hedef hesaba para girişi (VIRMAN_GIRIS)
                var targetResult = await PostTransactionAsync(
                    targetAccountId,
                    TransactionType.VIRMAN_GIRIS,
                    amount,
                    "giris",
                    $"{description} (Kaynak Hesap: {sourceAccountId})",
                    userId,
                    sourceAccountId
                );

                if (!targetResult)
                {
                    throw new Exception("Virman giriş işlemi başarısız oldu.");
                }

                // await _dbContext.SaveChangesAsync();
                // await dbTx.CommitAsync();

                Console.WriteLine($"Virman Başarılı: Kaynak={sourceAccountId} -> Hedef={targetAccountId}, Tutar={amount:F2} TL");
                return true;
            }
            catch (Exception ex)
            {
                // await dbTx.RollbackAsync();
                Console.WriteLine($"Virman işlemi iptal edildi (rollback): {ex.Message}");
                return false;
            }
        }
    }
}
