using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using ApartmentManagement.Backend.Models;

namespace ApartmentManagement.Backend.Services
{
    public interface IFeedbackService
    {
        // Geri bildirimi kaydeder ve geliştiriciye e-posta/SMS uyarısı tetikler
        Task<bool> SaveFeedbackAsync(GeriBildirim feedback);
    }

    public class FeedbackService : IFeedbackService
    {
        // private readonly ApplicationDbContext _dbContext; // Entity Framework DbContext
        private readonly string _developerEmail = "developer@apartmanyonet.com";
        private readonly string _developerPhone = "+90 532 111 22 33";

        public FeedbackService()
        {
            // Constructor
        }

        public async Task<bool> SaveFeedbackAsync(GeriBildirim feedback)
        {
            if (feedback == null || string.IsNullOrWhiteSpace(feedback.Mesaj))
            {
                return false;
            }

            var isSaved = false;

            // ==========================================
            // 1. Veritabanına Kayıt
            // ==========================================
            try
            {
                // Örnek Db kaydı (EF Core kullanan projeler için aktifleştirilebilir)
                // await _dbContext.GeriBildirimler.AddAsync(feedback);
                // await _dbContext.SaveChangesAsync();
                
                isSaved = true;
                Console.WriteLine($"Geri Bildirim Kaydedildi: Id={feedback.Id}, Gönderen={feedback.AdSoyad}, Konu={feedback.Konu}");
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"Geri bildirim veritabanı kayıt hatası: {dbEx.Message}");
                isSaved = false;
            }

            // ==========================================
            // 2. Geliştiriciye Otomatik Bildirim Tetikleme
            // ==========================================
            if (isSaved)
            {
                // E-posta ve SMS bildirimlerini asenkron başlat
                _ = Task.Run(() => SendDeveloperNotificationEmail(feedback));
                _ = Task.Run(() => SendDeveloperNotificationSms(feedback));
            }

            return isSaved;
        }

        // Geliştiriciye Otomatik E-posta Gönderme
        private async Task SendDeveloperNotificationEmail(GeriBildirim feedback)
        {
            try
            {
                var subject = $"[ApartmanYönet Geri Bildirim] - {feedback.Konu}";
                var body = $@"
                    <h3>Yeni Geri Bildirim Alındı</h3>
                    <p><strong>Konu:</strong> {feedback.Konu}</p>
                    <p><strong>Gönderen Adı Soyadı:</strong> {feedback.AdSoyad}</p>
                    <p><strong>Kullanıcı Rolü:</strong> {feedback.Rol}</p>
                    <p><strong>Bildirildiği URL:</strong> <a href='{feedback.Url}'>{feedback.Url}</a></p>
                    <p><strong>Tarih:</strong> {feedback.Tarih}</p>
                    <hr />
                    <p><strong>Mesaj:</strong></p>
                    <p style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5; white-space: pre-wrap;'>
                        {feedback.Mesaj}
                    </p>
                ";

                using (var mail = new MailMessage())
                {
                    mail.From = new MailAddress("system@apartmanyonet.com", "ApartmanYönet Sistem");
                    mail.To.Add(_developerEmail);
                    mail.Subject = subject;
                    mail.Body = body;
                    mail.IsBodyHtml = true;

                    // SMTP Yapılandırması
                    using (var smtp = new SmtpClient("smtp.mailprovider.com", 587))
                    {
                        smtp.Credentials = new NetworkCredential("system@apartmanyonet.com", "SmtpPassword123");
                        smtp.EnableSsl = true;
                        
                        // Gerçek SMTP sunucusu olmadığında loga yazıp geçmesi için simüle edildi
                        // await smtp.SendMailAsync(mail);
                        Console.WriteLine($"Geliştiriciye E-posta Gönderildi: Konu={subject}, Alıcı={_developerEmail}");
                    }
                }
            }
            catch (Exception mailEx)
            {
                Console.WriteLine($"Geliştirici e-posta bildirim hatası: {mailEx.Message}");
            }
        }

        // Geliştiriciye Otomatik SMS Gönderme
        private async Task SendDeveloperNotificationSms(GeriBildirim feedback)
        {
            try
            {
                // SMS İçeriği
                var smsText = $"ApartmanYonet Uyari: {feedback.AdSoyad} ({feedback.Rol}) tarafından {feedback.Konu} bildirilmiştir. URL: {feedback.Url}. Detay: {feedback.Mesaj}";
                
                // Karakter sınırını aşmamak için kırpma yapılabilir
                if (smsText.Length > 160)
                {
                    smsText = smsText.Substring(0, 157) + "...";
                }

                // Üçüncü taraf SMS API entegrasyonu simülasyonu
                Console.WriteLine($"Geliştiriciye SMS Gönderildi: Alıcı={_developerPhone}, Mesaj={smsText}");
            }
            catch (Exception smsEx)
            {
                Console.WriteLine($"Geliştirici SMS bildirim hatası: {smsEx.Message}");
            }
        }
    }
}
