using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ApartmentManagement.Backend.Models;
using ApartmentManagement.Backend.Services;

namespace ApartmentManagement.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentAccountController : ControllerBase
    {
        private readonly IPaymentAccountService _accountService;

        public PaymentAccountController(IPaymentAccountService accountService)
        {
            _accountService = accountService;
        }

        // ==========================================
        // 1. Yeni Ödeme Hesabı (Kasa/Banka) Tanımlama
        // ==========================================
        [HttpPost]
        public IActionResult CreateAccount([FromBody] CreateAccountDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Hesap adı boş olamaz.");
            }

            var type = dto.Type.ToUpper() == "BANKA" ? AccountType.BANKA : AccountType.KASA;

            var account = new PaymentAccount
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                Type = type,
                BankName = type == AccountType.BANKA ? dto.BankName : null,
                Iban = type == AccountType.BANKA ? dto.Iban : null,
                Owner = dto.Owner,
                Balance = dto.InitialBalance,
                CreatedAt = DateTime.Now
            };

            // Örnek EF Core db kaydı:
            // _dbContext.PaymentAccounts.Add(account);
            // _dbContext.SaveChanges();

            return Ok(new { Success = true, Message = "Hesap başarıyla tanımlandı.", Account = account });
        }

        // ==========================================
        // 2. Kasa/Banka Hesabına Tekil İşlem Ekleme
        // ==========================================
        [HttpPost("transaction")]
        public async Task<IActionResult> AddTransaction([FromBody] CreateTransactionDto dto)
        {
            if (dto == null || dto.Amount <= 0)
            {
                return BadRequest("Geçersiz işlem tutarı.");
            }

            TransactionType txType;
            string direction = "giris";

            switch (dto.Type.ToUpper())
            {
                case "TAHSILAT":
                    txType = TransactionType.TAHSILAT;
                    direction = "giris";
                    break;
                case "HARICI_TAHSILAT":
                    txType = TransactionType.HARICI_TAHSILAT;
                    direction = "giris";
                    break;
                case "GIDER_ODEME":
                    txType = TransactionType.GIDER_ODEME;
                    direction = "cikis";
                    break;
                case "FIRMA_PERSONEL_ODEME":
                    txType = TransactionType.FIRMA_PERSONEL_ODEME;
                    direction = "cikis";
                    break;
                default:
                    return BadRequest("Desteklenmeyen işlem türü.");
            }

            var result = await _accountService.PostTransactionAsync(
                dto.AccountId,
                txType,
                dto.Amount,
                direction,
                dto.Description,
                "user-001", // Simüle edilmiş aktif kullanıcı (Yönetici)
                null,
                dto.RelatedPersonId,
                dto.DocumentUrl
            );

            if (result)
            {
                return Ok(new { Success = true, Message = "Hesap hareketi kaydedildi ve bakiye güncellendi." });
            }

            return StatusCode(500, "İşlem kaydedilirken bir hata oluştu.");
        }

        // ==========================================
        // 3. Hesaplar Arası Virman (Para Transferi)
        // ==========================================
        [HttpPost("transfer")]
        public async Task<IActionResult> ExecuteTransfer([FromBody] CreateTransactionDto dto)
        {
            if (dto == null || dto.Amount <= 0 || string.IsNullOrWhiteSpace(dto.AccountId) || string.IsNullOrWhiteSpace(dto.TargetAccountId))
            {
                return BadRequest("Eksik veya geçersiz virman parametreleri.");
            }

            var result = await _accountService.ExecuteTransferAsync(
                dto.AccountId,
                dto.TargetAccountId,
                dto.Amount,
                dto.Description,
                "user-001" // Simüle edilmiş aktif kullanıcı (Yönetici)
            );

            if (result)
            {
                return Ok(new { Success = true, Message = "Virman işlemi başarıyla gerçekleştirildi." });
            }

            return StatusCode(500, "Virman işlemi gerçekleştirilemedi.");
        }
    }
}
