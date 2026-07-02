using System;

namespace ApartmentManagement.Backend.Models
{
    public enum AccountType
    {
        KASA,
        BANKA
    }

    public enum TransactionType
    {
        TAHSILAT,
        HARICI_TAHSILAT,
        GIDER_ODEME,
        FIRMA_PERSONEL_ODEME,
        VIRMAN_GIRIS,
        VIRMAN_CIKIS
    }

    // PaymentAccount Entity Model
    public class PaymentAccount
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public AccountType Type { get; set; } = AccountType.KASA;
        public string? BankName { get; set; }
        public string? Iban { get; set; }
        public string? Owner { get; set; }
        public decimal Balance { get; set; } = 0.0M;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // AccountTransaction Entity Model
    public class AccountTransaction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string AccountId { get; set; } = string.Empty;
        public TransactionType Type { get; set; } = TransactionType.TAHSILAT;
        public decimal Amount { get; set; }
        public string Direction { get; set; } = "giris"; // "giris" veya "cikis"
        public string? RelatedAccountId { get; set; }    // Virman durumunda karşı hesap ID'si
        public string Description { get; set; } = string.Empty;
        public string? RelatedPersonId { get; set; }
        public string? DocumentUrl { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.Now;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string CreatedBy { get; set; } = string.Empty;
    }

    // Create Account DTO
    public class CreateAccountDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "KASA"; // "KASA" veya "BANKA"
        public string? BankName { get; set; }
        public string? Iban { get; set; }
        public string? Owner { get; set; }
        public decimal InitialBalance { get; set; } = 0.0M;
    }

    // Create Transaction DTO
    public class CreateTransactionDto
    {
        public string AccountId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "TAHSILAT", "GIDER_ODEME", "VIRMAN" vb.
        public decimal Amount { get; set; }
        public string? TargetAccountId { get; set; }     // Virman için hedef hesap
        public string Description { get; set; } = string.Empty;
        public string? RelatedPersonId { get; set; }
        public string? DocumentUrl { get; set; }
    }
}
