using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ApartmentManagement.Backend.Models;
using ApartmentManagement.Backend.Services;

namespace ApartmentManagement.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmsController : ControllerBase
    {
        private readonly ISmsService _smsService;
        // private readonly ApplicationDbContext _dbContext; // Veritabanı sorguları için DbContext

        public SmsController(ISmsService smsService)
        {
            _smsService = smsService;
        }

        // ==========================================
        // 1. Gecikmiş Borçlar İçin Hatırlatma SMS Gönderimi
        // ==========================================
        [HttpPost("debt-reminders")]
        public async Task<IActionResult> SendDebtReminders()
        {
            // Örnek: Veritabanından vadesi geçmiş borçları ve borçlu bilgilerini çekme
            // SQL/LINQ Örneği:
            // var bugun = DateTime.Today;
            // var gecikenBorclar = await _dbContext.DaireBorclari
            //     .Where(b => b.VadeTarihi < bugun && b.KalanTutar > 0)
            //     .Select(b => new DaireBorcDto {
            //         KisiId = b.SakinId,
            //         AdSoyad = b.Sakin.AdSoyad,
            //         BlokDaireNo = b.Daire.BlokName + "/" + b.Daire.No,
            //         VadeTarihi = b.VadeTarihi,
            //         BorcTutari = b.KalanTutar,
            //         TelefonNo = b.Sakin.Telefon
            //     }).ToListAsync();

            // Test ve örnek veri listesi (Veritabanı bağlantısı olmadığında kullanılacak mock data)
            var mockGecikenBorclar = new List<DaireBorcDto>
            {
                new DaireBorcDto { KisiId = "user-004", AdSoyad = "Fatma Kaya", BlokDaireNo = "A/102", VadeTarihi = new DateTime(2026, 06, 15), BorcTutari = 1800, TelefonNo = "+90 536 444 55 66" },
                new DaireBorcDto { KisiId = "user-006", AdSoyad = "Ayşe Çelik", BlokDaireNo = "A/202", VadeTarihi = new DateTime(2026, 05, 15), BorcTutari = 240, TelefonNo = "+90 538 666 77 88" },
                new DaireBorcDto { KisiId = "user-010", AdSoyad = "Hatice Aydın", BlokDaireNo = "B/102", VadeTarihi = new DateTime(2026, 04, 15), BorcTutari = 1750, TelefonNo = "+90 543 100 11 22" }
            };

            int gonderilenSayisi = 0;
            int hataSayisi = 0;

            foreach (var borc in mockGecikenBorclar)
            {
                // İş Mantığı Şablonu:
                // "Sayın [Ad Soyad], [Blok/DaireNo] numaralı dairenize ait [VadeTarihi] vadeli [BorcTutari] TL borcunuz bulunmaktadır. ApartmanYönet"
                var vadeTarihiStr = borc.VadeTarihi.ToString("dd.MM.yyyy");
                var smsMetni = $"Sayın {borc.AdSoyad}, {borc.BlokDaireNo} numaralı dairenize ait {vadeTarihiStr} vadeli {borc.BorcTutari:F2} TL borcunuz bulunmaktadır. ApartmanYönet";

                var sonuc = await _smsService.SendSmsAsync(borc.TelefonNo, smsMetni, "Borc", borc.KisiId);
                
                if (sonuc) gonderilenSayisi++;
                else hataSayisi++;
            }

            return Ok(new { 
                Success = true, 
                Message = $"{gonderilenSayisi} adet borç hatırlatma mesajı gönderildi. {hataSayisi} adet hata oluştu.",
                SentCount = gonderilenSayisi,
                ErrorCount = hataSayisi
            });
        }

        // ==========================================
        // 2. Manuel Genel / Filtreli Duyuru Gönderimi
        // ==========================================
        [HttpPost("send-announcement")]
        public async Task<IActionResult> SendAnnouncement([FromBody] SendAnnouncementDto request)
        {
            if (string.IsNullOrWhiteSpace(request.MesajMetni))
            {
                return BadRequest("Duyuru metni boş olamaz.");
            }

            // Örnek: Sakin bilgilerini ve filtreye göre telefon numaralarını veritabanından çekme
            // var sakinlerListesi = await _dbContext.Sakinler.ToListAsync();

            // Mock Sakin Listesi (Duyuru alıcılarını filtrelemek için)
            var mockSakinler = new List<dynamic>
            {
                new { Id = "user-003", AdSoyad = "Ahmet Yılmaz", Blok = "A", Telefon = "+90 535 333 44 55", BorcuVar = false },
                new { Id = "user-004", AdSoyad = "Fatma Kaya", Blok = "A", Telefon = "+90 536 444 55 66", BorcuVar = true },
                new { Id = "user-005", AdSoyad = "Mehmet Demir", Blok = "A", Telefon = "+90 537 555 66 77", BorcuVar = false },
                new { Id = "user-009", AdSoyad = "Ali Yıldırım", Blok = "B", Telefon = "+90 542 999 00 11", BorcuVar = false },
                new { Id = "user-010", AdSoyad = "Hatice Aydın", Blok = "B", Telefon = "+90 543 100 11 22", BorcuVar = true }
            };

            // Hedef Kitle Filtreleme Mantığı
            var hedefSakinler = new List<dynamic>();

            switch (request.HedefKitle)
            {
                case "Tumu":
                    hedefSakinler = mockSakinler;
                    break;
                case "Borclular":
                    hedefSakinler = mockSakinler.Where(s => s.BorcuVar).ToList();
                    break;
                case "ABlok":
                    hedefSakinler = mockSakinler.Where(s => s.Blok == "A").ToList();
                    break;
                case "BBlok":
                    hedefSakinler = mockSakinler.Where(s => s.Blok == "B").ToList();
                    break;
                case "SeciliKisiler":
                    if (request.SeciliKisiIds != null && request.SeciliKisiIds.Any())
                    {
                        hedefSakinler = mockSakinler.Where(s => request.SeciliKisiIds.Contains((string)s.Id)).ToList();
                    }
                    break;
                default:
                    return BadRequest("Geçersiz hedef kitle seçimi.");
            }

            if (!hedefSakinler.Any())
            {
                return Ok(new { Success = false, Message = "Kriterlere uygun alıcı bulunamadı." });
            }

            int gonderilenSayisi = 0;
            int hataSayisi = 0;

            foreach (var sakin in hedefSakinler)
            {
                var sonuc = await _smsService.SendSmsAsync((string)sakin.Telefon, request.MesajMetni, "Duyuru", (string)sakin.Id);
                
                if (sonuc) gonderilenSayisi++;
                else hataSayisi++;
            }

            return Ok(new { 
                Success = true, 
                Message = $"Duyuru {gonderilenSayisi} kişiye gönderildi. {hataSayisi} adet hata oluştu.",
                SentCount = gonderilenSayisi,
                ErrorCount = hataSayisi
            });
        }
    }
}
