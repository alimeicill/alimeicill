using System;

namespace ApartmentManagement.Backend.Models
{
    // SmsLog Entity Model (veritabanı tablosu ile eşleşir)
    public class SmsLog
    {
        public int Id { get; set; }
        public string? KisiId { get; set; }
        public string SmsTipi { get; set; } = "Duyuru"; // "Duyuru" veya "Borc"
        public string TelefonNo { get; set; } = string.Empty;
        public string MesajMetni { get; set; } = string.Empty;
        public DateTime GonderimTarihi { get; set; } = DateTime.Now;
        public string Durum { get; set; } = "Basarili"; // "Basarili" veya "Basarisiz"
    }

    // Daire Borç Bilgileri DTO
    public class DaireBorcDto
    {
        public string KisiId { get; set; } = string.Empty;
        public string AdSoyad { get; set; } = string.Empty;
        public string BlokDaireNo { get; set; } = string.Empty;
        public DateTime VadeTarihi { get; set; }
        public decimal BorcTutari { get; set; }
        public string TelefonNo { get; set; } = string.Empty;
    }

    // Manuel Duyuru Gönderim Parametreleri DTO
    public class SendAnnouncementDto
    {
        public string HedefKitle { get; set; } = "Tumu"; // "Tumu", "Borclular", "ABlok", "BBlok", "SeciliKisiler"
        public string MesajMetni { get; set; } = string.Empty;
        public string[]? SeciliKisiIds { get; set; }     // Eğer "SeciliKisiler" tercih edildiyse
    }
}
