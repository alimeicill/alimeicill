using System;

namespace ApartmentManagement.Backend.Models
{
    // GeriBildirim Entity Model (veritabanı tablosu ile eşleşir)
    public class GeriBildirim
    {
        public int Id { get; set; }
        public string Konu { get; set; } = string.Empty; // "Hata Bildirimi", "Gelistirme Onerisi", "Diger"
        public string Mesaj { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty; // "Site Yoneticisi", "Daire Sakini", "Teknik Personel" vb.
        public string AdSoyad { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty; // Hatanın oluştuğu sayfanın URL'si
        public DateTime Tarih { get; set; } = DateTime.Now;
        public string Durum { get; set; } = "Yeni"; // "Yeni", "Inceleniyor", "Tamamlandi"
    }

    // Geri Bildirim Oluşturma DTO
    public class CreateFeedbackDto
    {
        public string Konu { get; set; } = string.Empty;
        public string Mesaj { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public string AdSoyad { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
}
